import React, { useState, useEffect, useMemo } from "react";
import { authApi, usersApi, filesApi } from "../../api";
import { useAuth } from "../../contexts/AuthContext";
import { Card, PageHeader, Btn, Field } from "../../components/ui";
import toast from "react-hot-toast";

const PHONE_LEN = 11;
const PHONE_TOAST_ID = "profile-phone-toast";
const MAX_FILE_SIZE = 50 * 1024 * 1024;

const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
];

const DANGEROUS_EXTENSIONS = [
  ".exe",
  ".bat",
  ".cmd",
  ".sh",
  ".ps1",
  ".jar",
  ".app",
  ".msi",
  ".py",
  ".rb",
  ".php",
];

const sanitizePhone = (value) => value.replace(/\D/g, "").slice(0, PHONE_LEN);
const isValidPhone = (value) => /^09\d{9}$/.test(value);

function validateFile(file) {
  if (file.size > MAX_FILE_SIZE) {
    return `حجم فایل بیش از حد مجاز است. حداکثر حجم مجاز 50 مگابایت است. اندازه فایل شما ${(file.size / (1024 * 1024)).toFixed(1)} مگابایت است.`;
  }
  const fileName = file.name;
  const fileExt = fileName.substring(fileName.lastIndexOf(".")).toLowerCase();
  if (DANGEROUS_EXTENSIONS.includes(fileExt)) {
    return `نوع فایل ${fileExt} به دلایل امنیتی مجاز نیست.`;
  }
  if (!ALLOWED_FILE_TYPES.includes(file.type) && file.type !== "") {
    return `نوع فایل "${file.type}" مجاز نیست. نوع‌های مجاز: تصاویر، PDF، اسناد و فایل‌های متنی.`;
  }
  return null;
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState("personal");
  const [saving, setSaving] = useState(false);
  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const [info, setInfo] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    phone: user?.phone || "",
    email_notifications: true,
    sms_notifications: false,
  });

  const [flProfile, setFlProfile] = useState({
    bio: "",
    portfolio_url: "",
    years_experience: 0,
    skills: "",
  });

  const [pw, setPw] = useState({
    old_password: "",
    new_password: "",
    new_password2: "",
  });

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error("حجم فایل نباید بیشتر از 50 مگابایت باشد.");
      e.target.value = "";
      return;
    }

    setUploadingAvatar(true);
    try {
      await authApi.uploadAvatar(file);
      await refreshUser();
      toast.success("آواتار بارگذاری شد!");
      e.target.value = "";
    } catch (e) {
      const msg = e.response?.data?.error || "بارگذاری ناموفق بود";
      toast.error(String(msg));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!window.confirm("آواتار خود را حذف می‌کنید؟")) return;

    try {
      await authApi.deleteAvatar();
      await refreshUser();
      toast.success("آواتار حذف شد!");
    } catch (e) {
      toast.error("حذف ناموفق بود");
    }
  };

  const loadFiles = async () => {
    setLoadingFiles(true);
    try {
      const res = await filesApi.list({ category: "freelancer_doc" });
      setFiles(res.data.results || res.data);
    } catch (e) {
      console.error("بارگذاری فایل‌ها ناموفق بود");
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      toast.error(error);
      e.target.value = "";
      return;
    }

    setUploadingFile(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("category", "freelancer_doc");
      await filesApi.upload(fd);
      toast.success("فایل بارگذاری شد!");
      loadFiles();
      e.target.value = "";
    } catch (err) {
      const errMsg = err.response?.data?.error || "بارگذاری ناموفق بود";
      toast.error(errMsg);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm("این فایل حذف شود؟")) return;
    try {
      await filesApi.remove(fileId);
      toast.success("فایل حذف شد");
      loadFiles();
    } catch (err) {
      toast.error("حذف فایل ناموفق بود");
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const validatePhone = (value) => {
    const phone = sanitizePhone(value);

    if (!phone) {
      toast.dismiss(PHONE_TOAST_ID);
      return true;
    }

    if (!phone.startsWith("09")) {
      toast.error("شماره باید با 09 شروع شود", { id: PHONE_TOAST_ID });
      return false;
    }

    if (!isValidPhone(phone)) {
      toast.error("شماره تماس باید دقیقاً 11 رقم باشد و با 09 شروع شود", {
        id: PHONE_TOAST_ID,
      });
      return false;
    }

    toast.dismiss(PHONE_TOAST_ID);
    return true;
  };

  const phoneIsValid = useMemo(
    () => isValidPhone(info.phone.trim()),
    [info.phone],
  );

  const handleSave = async () => {
    const phone = sanitizePhone(info.phone);

    if (!isValidPhone(phone)) {
      toast.error("شماره تماس باید دقیقاً 11 رقم باشد و با 09 شروع شود", {
        id: PHONE_TOAST_ID,
      });
      return;
    }

    setSaving(true);
    try {
      await authApi.updateMe({ ...info, phone });

      if (user?.role === "freelancer") {
        const skills = flProfile.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        await usersApi.updateFreelancerProfile({
          ...flProfile,
          years_experience: Number(flProfile.years_experience) || 0,
          skills,
        });
      }

      await refreshUser();
      toast.success("تغییرات ذخیره شد!");
    } catch (e) {
      const d = e.response?.data;
      if (d)
        Object.values(d)
          .flat()
          .forEach((m) => toast.error(String(m)));
      else toast.error("به‌روزرسانی ناموفق بود");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!pw.old_password || !pw.new_password || !pw.new_password2) {
      toast.error("همه فیلدهای رمز عبور را پر کنید");
      return;
    }

    if (pw.new_password !== pw.new_password2) {
      toast.error("رمز عبور و تکرار آن یکسان نیستند");
      return;
    }

    try {
      await authApi.changePassword(pw);
      toast.success("رمز عبور تغییر کرد!");
      setPw({ old_password: "", new_password: "", new_password2: "" });
    } catch (e) {
      const d = e.response?.data;
      if (d)
        Object.values(d)
          .flat()
          .forEach((m) => toast.error(String(m)));
      else toast.error("تغییر رمز عبور ناموفق بود");
    }
  };

  const tabs = [
    ["personal", "اطلاعات شخصی"],
    ["security", "امنیت"],
    ...(user?.role === "freelancer"
      ? [["freelancer", "پروفایل فریلنسر"]]
      : []),
  ];

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      <PageHeader title="پروفایل من" subtitle="مدیریت تنظیمات حساب کاربری" />

      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--border)",
          marginBottom: "1.5rem",
        }}
      >
        {tabs.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: "8px 16px",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font)",
              fontSize: "0.875rem",
              fontWeight: tab === key ? 600 : 400,
              color: tab === key ? "var(--accent)" : "var(--text-muted)",
              borderBottom:
                tab === key
                  ? "2px solid var(--accent)"
                  : "2px solid transparent",
              marginBottom: "-1px",
              transition: "color 0.15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "personal" && (
        <Card>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              marginBottom: "1.5rem",
              paddingBottom: "1.25rem",
              borderBottom: "1px solid var(--border)",
              position: "relative",
            }}
          >
            <div style={{ position: "relative", flexShrink: 0 }}>
              {user?.avatar ? (
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={user.avatar}
                    alt="Avatar"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: "50%",
                    background: "var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "white",

                  }}
                >
                  {user?.first_name?.[0]}
                  {user?.last_name?.[0]}
                </div>
              )}
              <label
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "1rem",
                  fontWeight: 700,
                  border: "2px solid var(--bg-card)",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(47,129,247,0.8)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "var(--accent)")
                }
                title="بارگذاری آواتار"
              >
                +
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                  style={{ display: "none" }}
                />
              </label>
            </div>

            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: "1rem" }}>
                {user?.first_name} {user?.last_name}
              </p>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                {user?.email} ·{" "}
                <span style={{ textTransform: "capitalize" }}>
                  {user?.role}
                </span>
              </p>
              {user?.avatar && (
                <Btn
                  onClick={handleDeleteAvatar}
                  variant="ghost"
                  size="sm"
                  style={{ marginTop: "0.5rem", color: "var(--red)" }}
                >
                  حذف آواتار
                </Btn>
              )}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
            }}
          >
            <Field label="نام">
              <input
                value={info.first_name}
                onChange={(e) =>
                  setInfo((i) => ({ ...i, first_name: e.target.value }))
                }
              />
            </Field>

            <Field label="نام خانوادگی">
              <input
                value={info.last_name}
                onChange={(e) =>
                  setInfo((i) => ({ ...i, last_name: e.target.value }))
                }
              />
            </Field>
          </div>

          <Field label="شماره تماس">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={PHONE_LEN}
              value={info.phone}
              onChange={(e) => {
                const digits = sanitizePhone(e.target.value);
                setInfo((i) => ({ ...i, phone: digits }));
              }}
              onBlur={() => validatePhone(info.phone)}
              placeholder="09950081859"
            />
          </Field>

          <div
            style={{
              marginBottom: "1.25rem",
              padding: "1rem",
              borderRadius: "var(--radius)",
              border: "1px solid var(--border)",
              background: "var(--bg-surface)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
                marginBottom: "0.85rem",
              }}
            >
              <p
                style={{
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  color: "var(--text)",
                  margin: 0,
                }}
              >
                تنظیمات اعلان‌ها
              </p>
              <p
                style={{
                  fontSize: "0.78rem",
                  color: "var(--text-muted)",
                  margin: 0,
                }}
              >
                انتخاب کنید چه‌طور با ما در ارتباط باشید
              </p>
            </div>

            <div style={{ display: "grid", gap: "0.75rem" }}>
              {[
                [
                  "email_notifications",
                  "اعلان‌های ایمیل",
                  "دریافت به‌روزرسانی‌ها و هشدارها از طریق ایمیل.",
                ],
                [
                  "sms_notifications",
                  "اعلان‌های پیامک",
                  "دریافت پیام‌های مهم مستقیماً به گوشی شما.",
                ],
              ].map(([k, label, hint]) => (
                <label
                  key={k}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1rem",
                    padding: "0.95rem 1rem",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border)",
                    background: "var(--bg-card)",
                    cursor: "pointer",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.95rem",
                        fontWeight: 600,
                        color: "var(--text)",
                      }}
                    >
                      {label}
                    </p>
                    <p
                      style={{
                        margin: "0.25rem 0 0",
                        fontSize: "0.8rem",
                        color: "var(--text-muted)",
                        lineHeight: 1.4,
                      }}
                    >
                      {hint}
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={Boolean(info[k])}
                    onChange={(e) =>
                      setInfo((i) => ({ ...i, [k]: e.target.checked }))
                    }
                    style={{
                      width: 18,
                      height: 18,
                      accentColor: "var(--accent)",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  />
                </label>
              ))}
            </div>
          </div>

          <Btn onClick={handleSave} loading={saving} disabled={!phoneIsValid} className="mt-4">
            ذخیره تغییرات
          </Btn>
        </Card>
      )}

      {tab === "security" && (
        <Card>
          <h3
            style={{
              fontWeight: 600,
              marginBottom: "1.25rem",
              fontSize: "0.95rem",
            }}
          >
            تغییر رمز عبور
          </h3>

          <Field label="رمز عبور فعلی">
            <input
              type="password"
              value={pw.old_password}
              onChange={(e) =>
                setPw((p) => ({ ...p, old_password: e.target.value }))
              }
            />
          </Field>

          <Field label="رمز عبور جدید">
            <input
              type="password"
              value={pw.new_password}
              onChange={(e) =>
                setPw((p) => ({ ...p, new_password: e.target.value }))
              }
            />
          </Field>

          <Field label="تأیید رمز عبور جدید">
            <input
              type="password"
              value={pw.new_password2}
              onChange={(e) =>
                setPw((p) => ({ ...p, new_password2: e.target.value }))
              }
            />
          </Field>

          <Btn onClick={handlePasswordChange}>به‌روزرسانی رمز عبور</Btn>
        </Card>
      )}

      {tab === "freelancer" && (
        <Card>
          <div
            style={{
              padding: "10px 14px",
              background: "var(--accent-glow)",
              border: "1px solid rgba(47,129,247,0.2)",
              borderRadius: "var(--radius)",
              marginBottom: "1.25rem",
              fontSize: "0.83rem",
              color: "var(--text-sub)",
              lineHeight: 1.7,
            }}
          >
            <strong>وضعیت:</strong>{" "}
            <span
              style={{ textTransform: "capitalize", color: "var(--accent)" }}
            >
              {user?.freelancer_profile?.verification_status}
            </span>
            &nbsp;·&nbsp;
            <strong>سطح:</strong>{" "}
            <span style={{ color: "var(--amber)" }}>
              {user?.freelancer_profile?.level?.name || "تخصیص داده نشده"}
            </span>
          </div>

          <Field label="بیوگرافی" hint="در مورد خود به مشتریان بگویید">
            <textarea
              rows={4}
              value={flProfile.bio}
              onChange={(e) =>
                setFlProfile((p) => ({ ...p, bio: e.target.value }))
              }
              placeholder="تخصص و تجربه خود را توضیح دهید…"
            />
          </Field>

          <Field label="آدرس پورتفولیو">
            <input
              value={flProfile.portfolio_url}
              onChange={(e) =>
                setFlProfile((p) => ({ ...p, portfolio_url: e.target.value }))
              }
              placeholder="https://yourportfolio.com"
            />
          </Field>

          <Field label="سال‌های تجربه">
            <input
              type="number"
              min={0}
              value={flProfile.years_experience}
              onChange={(e) =>
                setFlProfile((p) => ({
                  ...p,
                  years_experience: Number(e.target.value) || 0,
                }))
              }
            />
          </Field>

          <Field
            label="مهارت‌ها"
            hint="با ویرگول جدا کنید: ویرایش ویدیو، گرافیک متحرک، رنگ‌بندی"
          >
            <input
              value={flProfile.skills}
              onChange={(e) =>
                setFlProfile((p) => ({ ...p, skills: e.target.value }))
              }
              placeholder="مهارت 1، مهارت 2، مهارت 3"
            />
          </Field>

          <Btn onClick={handleSave} loading={saving} disabled={!phoneIsValid}>
            ذخیره پروفایل
          </Btn>
        </Card>
      )}

      {tab === "files" && (
        <Card>
          <h3
            style={{
              fontWeight: 600,
              marginBottom: "1.25rem",
              fontSize: "0.95rem",
            }}
          >
            مدارک من
          </h3>

          <div
            style={{
              marginBottom: "1.5rem",
              paddingBottom: "1.25rem",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <label
              style={{
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.875rem",
              }}
            >
              <input
                type="file"
                style={{ display: "none" }}
                onChange={handleFileUpload}
                disabled={uploadingFile}
              />
              <Btn loading={uploadingFile} onClick={() => { }}>
                📎 بارگذاری فایل
              </Btn>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                (حداکثر 50 مگابایت • تصاویر، PDF، اسناد، فایل‌های متنی)
              </span>
            </label>
          </div>

          {loadingFiles ? (
            <p
              style={{
                color: "var(--text-muted)",
                textAlign: "center",
                padding: "2rem",
              }}
            >
              درحال بارگذاری فایل‌ها…
            </p>
          ) : files.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
              هنوز فایلی بارگذاری نشده است
            </p>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {files.map((f) => (
                <div
                  key={f.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 12px",
                    background: "var(--bg-surface)",
                    borderRadius: "var(--radius)",
                    fontSize: "0.875rem",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 500, marginBottom: 4 }}>
                      📄 {f.original_name}
                    </p>
                    <p
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {f.size_display} •{" "}
                      {new Date(f.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "4px",
                      alignItems: "center",
                      flexShrink: 0,
                      marginLeft: "1rem",
                    }}
                  >
                    <a href={f.url} target="_blank" rel="noreferrer">
                      <Btn size="xs" variant="secondary">
                        ↓
                      </Btn>
                    </a>
                    <Btn
                      size="xs"
                      variant="danger"
                      onClick={() => handleDeleteFile(f.id)}
                    >
                      ✕
                    </Btn>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

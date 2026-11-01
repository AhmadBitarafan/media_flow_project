from django.contrib import admin
from .models import ProjectRequest, Project, ProjectAssignment, ProjectStatusHistory, ProjectMilestone, ProjectRevision


@admin.register(ProjectRequest)
class ProjectRequestAdmin(admin.ModelAdmin):
    list_display = ['title', 'customer', 'project_type', 'status', 'created_at']
    list_filter = ['status', 'project_type']
    search_fields = ['title', 'customer__email']


class AssignmentInline(admin.TabularInline):
    model = ProjectAssignment
    extra = 0


class MilestoneInline(admin.TabularInline):
    model = ProjectMilestone
    extra = 0


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['title', 'customer', 'project_type', 'status', 'priority', 'deadline', 'created_at']
    list_filter = ['status', 'project_type', 'priority']
    search_fields = ['title', 'customer__email']
    inlines = [AssignmentInline, MilestoneInline]


@admin.register(ProjectAssignment)
class ProjectAssignmentAdmin(admin.ModelAdmin):
    list_display = ['project', 'freelancer', 'status', 'created_at']
    list_filter = ['status']

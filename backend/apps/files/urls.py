from django.urls import path
from .views import FileUploadView, FileListView, FileDeleteView

urlpatterns = [
    path('upload/', FileUploadView.as_view(), name='file-upload'),
    path('', FileListView.as_view(), name='file-list'),
    path('<uuid:pk>/', FileDeleteView.as_view(), name='file-delete'),
]

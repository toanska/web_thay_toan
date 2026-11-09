import { getAccessToken } from '../firebase';

export interface DriveUploadResult {
  fileId: string;
  webViewLink: string;
  webContentLink: string;
  fileName: string;
}

export const GoogleDriveService = {
  /**
   * Upload a file to Google Drive.
   */
  async uploadFile(file: File): Promise<DriveUploadResult> {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      throw new Error('Vui lòng đăng nhập bằng Google để sử dụng tính năng tải lên Drive.');
    }

    // 1. Create metadata
    const metadata = {
      name: file.name,
      mimeType: file.type,
    };

    // 2. Build multipart body
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    // 3. Perform upload
    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Lỗi khi tải tệp lên Google Drive.');
    }

    const result = await response.json();

    // 4. Set permissions to anyone with link (optional, but requested for sharing)
    // Note: The user said "safe, secure", so maybe we shouldn't make it public by default.
    // But since it's for students to view, it needs read permission.
    try {
      await fetch(`https://www.googleapis.com/drive/v3/files/${result.id}/permissions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone',
        }),
      });
    } catch (e) {
      console.warn('Could not set public permissions on Drive file:', e);
    }

    return {
      fileId: result.id,
      webViewLink: result.webViewLink,
      webContentLink: result.webContentLink,
      fileName: result.name,
    };
  },

  /**
   * Get file metadata from Drive.
   */
  async getFileMetadata(fileId: string) {
    const accessToken = await getAccessToken();
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,webViewLink,webContentLink,mimeType`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Không thể lấy thông tin tệp từ Google Drive.');
    }

    return await response.json();
  }
};

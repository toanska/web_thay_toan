import { getAccessToken, googleSignIn } from '../firebase';

const BACKUP_FILE_NAME = 'THCS_NgoQuyen_Website_Backup.json';

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
      if (response.status === 401) {
        throw new Error('Phiên đăng nhập Google đã hết hạn. Vui lòng kết nối lại tài khoản Google.');
      }
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Lỗi khi tải tệp lên Google Drive.');
    }

    const result = await response.json();

    // 4. Set permissions to anyone with link (optional, but requested for sharing)
    // Note: The user said "safe, secure", so maybe we shouldn't make it public by default.
    // But since it's for students to view, it needs read permission.
    // 4. Set permissions to anyone with link
    // This is CRITICAL for students to be able to view the file without logging in.
    const permResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${result.id}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
        allowFileDiscovery: false, // Secure: only those with the link can find it
      }),
    });

    if (!permResponse.ok) {
      const permError = await permResponse.json();
      console.error('Drive Permission Error:', permError);
      throw new Error(`Tải tệp thành công nhưng không thể thiết lập quyền chia sẻ: ${permError.error?.message || 'Lỗi không xác định'}. Vui lòng kiểm tra quyền chia sẻ thủ công trên Google Drive.`);
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
  },

  /**
   * Diagnose Google Drive file accessibility and permissions.
   */
  async diagnoseDriveFile(fileUrl: string): Promise<{
    ok: boolean;
    status: 'public' | 'restricted' | 'error';
    message: string;
    details: string[];
  }> {
    const details: string[] = [];
    let fileId = '';

    const idMatch = fileUrl.match(/\/(?:file|document|presentation|spreadsheets)\/d\/([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) {
      fileId = idMatch[1];
    } else if (fileUrl.includes('?id=') || fileUrl.includes('&id=')) {
      try {
        fileId = new URL(fileUrl).searchParams.get('id') || '';
      } catch {
        fileId = '';
      }
    }

    if (!fileId) {
      console.warn('[Drive Diagnostic] Invalid Drive URL:', fileUrl);
      return {
        ok: false,
        status: 'error',
        message: 'Không tìm thấy File ID hợp lệ trong đường dẫn Google Drive.',
        details: ['Đường dẫn cần có dạng https://drive.google.com/file/d/<ID>/view hoặc ?id=<ID>.']
      };
    }

    details.push(`File ID: ${fileId}`);

    const accessToken = await getAccessToken();
    if (!accessToken) {
      console.warn('[Drive Diagnostic] Missing Google Access Token.');
      return {
        ok: false,
        status: 'error',
        message: 'Chưa đăng nhập Google hoặc phiên đã hết hạn.',
        details: [
          ...details,
          'Vui lòng đảm bảo tệp Google Drive đã được bật chia sẻ quyền xem công khai (Bất kỳ ai có liên kết).'
        ]
      };
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,shared,permissions(id,type,role)`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData.error?.message || response.statusText;
        console.error(`[Drive Diagnostic] HTTP ${response.status}:`, errData);

        if (response.status === 401) {
          return {
            ok: false,
            status: 'error',
            message: '401 Unauthorized: Phiên đăng nhập Google đã hết hạn.',
            details: [...details, 'Hãy đăng nhập lại bằng Google để làm mới token.']
          };
        }
        if (response.status === 403) {
          return {
            ok: false,
            status: 'error',
            message: '403 Forbidden: Không có quyền truy cập tệp này.',
            details: [
              ...details,
              `Chi tiết từ Google: ${errMsg}`,
              'Nguyên nhân: Tệp thuộc tài khoản khác chưa chia sẻ cho bạn, hoặc tài khoản trường học (.edu.vn) đang khóa API.'
            ]
          };
        }
        if (response.status === 404) {
          return {
            ok: false,
            status: 'error',
            message: '404 File Not Found: Không tìm thấy tệp trên Google Drive.',
            details: [
              ...details,
              'Nguyên nhân: Tệp đã bị xóa, nằm trong Thùng rác, hoặc File ID bị sai.'
            ]
          };
        }

        return {
          ok: false,
          status: 'error',
          message: `Lỗi HTTP ${response.status}: ${errMsg}`,
          details
        };
      }

      const data = await response.json();
      details.push(`Tên tệp: ${data.name}`);
      details.push(`Định dạng: ${data.mimeType}`);

      const permissions: Array<{ id: string; type: string; role: string }> = data.permissions || [];
      const anyonePerm = permissions.find((p) => p.type === 'anyone');

      if (anyonePerm) {
        details.push(`Quyền công khai: Có (type=anyone, role=${anyonePerm.role})`);
        return {
          ok: true,
          status: 'public',
          message: 'Hợp lệ! Tệp đã được mở quyền "Bất kỳ ai có đường liên kết".',
          details
        };
      }

      details.push(`Quyền hiện tại: Chỉ riêng tư / nội bộ (${permissions.length} mục quyền).`);
      return {
        ok: false,
        status: 'restricted',
        message: 'Cảnh báo: Tệp CHƯA bật quyền công khai cho học sinh.',
        details: [
          ...details,
          'Học sinh sẽ gặp lỗi "Bạn cần có quyền truy cập" khi mở trên máy khác.',
          'Cách sửa: Mở tệp trên Drive -> Chia sẻ -> Bất kỳ ai có đường liên kết (Người xem).'
        ]
      };
    } catch (err: any) {
      console.error('[Drive Diagnostic] Network/Fetch error:', err);
      return {
        ok: false,
        status: 'error',
        message: 'Lỗi kết nối khi kiểm tra Google Drive.',
        details: [...details, err?.message || 'Lỗi mạng không xác định.']
      };
    }
  },

  /**
   * Ensure we have a valid Google Drive OAuth access token (prompts teacher Google popup if needed).
   */
  async ensureAccessToken(): Promise<string> {
    let token = await getAccessToken();
    if (!token) {
      const signInRes = await googleSignIn();
      token = signInRes?.accessToken || null;
    }
    if (!token) {
      throw new Error('Không lấy được quyền truy cập Google Drive. Vui lòng thử lại.');
    }
    return token;
  },

  /**
   * Backup the entire website JSON payload to a dedicated file in the teacher's Google Drive.
   */
  async backupAllDataToDrive(jsonContent: string): Promise<{
    fileId: string;
    fileName: string;
    webViewLink?: string;
    savedAt: string;
  }> {
    const accessToken = await this.ensureAccessToken();

    // 1. Check if backup file already exists (created by this app via drive.file scope)
    const searchQuery = encodeURIComponent(`name = '${BACKUP_FILE_NAME}' and trashed = false`);
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${searchQuery}&orderBy=modifiedTime desc&fields=files(id,name,webViewLink,modifiedTime)`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    let existingFileId: string | null = null;
    if (searchRes.ok) {
      const searchJson = await searchRes.json();
      if (Array.isArray(searchJson.files) && searchJson.files.length > 0) {
        existingFileId = searchJson.files[0].id;
      }
    }

    const metadata = {
      name: BACKUP_FILE_NAME,
      mimeType: 'application/json',
      description: 'Bản sao lưu toàn bộ dữ liệu Website Khảo Thí & Bài Giảng THCS Ngô Quyền - Thầy Toàn'
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([jsonContent], { type: 'application/json' }));

    const uploadUrl = existingFileId
      ? `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart&fields=id,name,webViewLink`
      : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink`;

    const uploadRes = await fetch(uploadUrl, {
      method: existingFileId ? 'PATCH' : 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form
    });

    if (!uploadRes.ok) {
      const errJson = await uploadRes.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Lỗi lưu sao lưu lên Google Drive (HTTP ${uploadRes.status}).`);
    }

    const saved = await uploadRes.json();
    return {
      fileId: saved.id,
      fileName: saved.name || BACKUP_FILE_NAME,
      webViewLink: saved.webViewLink,
      savedAt: new Date().toISOString()
    };
  },

  /**
   * Restore full website JSON backup from Google Drive.
   */
  async restoreAllDataFromDrive(): Promise<{ jsonContent: string; fileName: string; modifiedTime?: string }> {
    const accessToken = await this.ensureAccessToken();

    const searchQuery = encodeURIComponent(`name = '${BACKUP_FILE_NAME}' and trashed = false`);
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${searchQuery}&orderBy=modifiedTime desc&fields=files(id,name,modifiedTime)`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    if (!searchRes.ok) {
      const errJson = await searchRes.json().catch(() => ({}));
      throw new Error(errJson.error?.message || 'Không thể tìm tệp sao lưu trên Google Drive.');
    }

    const searchJson = await searchRes.json();
    const file = searchJson.files?.[0];
    if (!file?.id) {
      throw new Error(`Chưa tìm thấy tệp "${BACKUP_FILE_NAME}" trên Google Drive của bạn. Hãy bấm "Sao lưu lên Google Drive" trước.`);
    }

    const mediaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!mediaRes.ok) {
      throw new Error(`Không thể tải nội dung sao lưu từ Google Drive (HTTP ${mediaRes.status}).`);
    }

    const jsonContent = await mediaRes.text();
    return {
      jsonContent,
      fileName: file.name || BACKUP_FILE_NAME,
      modifiedTime: file.modifiedTime
    };
  }
};

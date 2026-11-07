import { User } from '../types';

/**
 * Kiểm tra xem người dùng hiện tại có phải là Thầy Toàn hoặc Quản trị viên (Admin) hay không.
 * Chỉ Thầy Toàn hoặc Admin mới có quyền truy cập và quản lý phân hệ Tài khoản học sinh.
 */
export function isTeacherToanOrAdmin(user?: User | null): boolean {
  if (!user) return false;
  
  // Kiểm tra vai trò Admin
  if (user.role === 'admin') return true;

  // Kiểm tra mã định danh giáo viên của Thầy Toàn hoặc Admin
  const code = (user.code || '').trim().toUpperCase();
  if (code === 'GV-TINHOC01' || code === 'ADMIN-TINHOC') return true;

  // Kiểm tra tên người dùng có chứa chữ Toàn
  const name = (user.name || '').trim().toLowerCase();
  if (name.includes('toàn') || name.includes('toan') || name.includes('thầy toàn') || name.includes('thay toan')) {
    return true;
  }

  // Kiểm tra email
  const email = (user.email || '').trim().toLowerCase();
  if (email.includes('toanska') || email.includes('admin.tinhoc')) {
    return true;
  }

  return false;
}

export function removeVietnameseTones(str: string): string {
  if (!str) return '';
  let s = str;
  s = s.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  s = s.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  s = s.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  s = s.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  s = s.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  s = s.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  s = s.replace(/đ/g, 'd');
  s = s.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A');
  s = s.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E');
  s = s.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I');
  s = s.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O');
  s = s.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U');
  s = s.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'Y');
  s = s.replace(/Đ/g, 'D');
  return s.toLowerCase().trim();
}

/**
 * Tìm kiếm tài khoản chính xác theo Mã học sinh / Mã tài khoản (VD: HS-20269101 hoặc 20269101) hoặc Email.
 * Yêu cầu nhập đúng Mã tài khoản hoặc Email (không hỗ trợ gõ tên đăng nhập).
 */
export function findUserForLogin(users: User[], inputQuery: string): User | undefined {
  if (!inputQuery || !inputQuery.trim()) return undefined;
  const rawQuery = inputQuery.trim();
  const queryLower = rawQuery.toLowerCase();
  const sanitizedQuery = rawQuery.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  return users.find(u => {
    // 1. Khớp Email chính xác
    if (u.email && u.email.trim().toLowerCase() === queryLower) return true;

    // 2. Khớp Mã định danh tài khoản chính xác (VD: HS-20269101, GV-TINHOC01, ADMIN-01)
    if (u.code) {
      const codeLower = u.code.trim().toLowerCase();
      if (codeLower === queryLower) return true;

      const sanitizedCode = u.code.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      if (sanitizedCode && sanitizedQuery) {
        if (sanitizedCode === sanitizedQuery) return true;
        // Cho phép nhập dãy số không có tiền tố HS- (VD: 20269101 khớp HS-20269101)
        if (sanitizedCode === `hs${sanitizedQuery}`) return true;
      }
    }

    return false;
  });
}

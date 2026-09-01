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

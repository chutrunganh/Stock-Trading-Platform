/**
 * Modal là một thành phần giao diện người dùng (UI) hiển thị nội dung tạm thời trên một lớp phủ (overlay) che phủ phần còn lại của trang web, thường được sử dụng để thu hút sự chú ý của người dùng vào một tác vụ cụ thể, chẳng hạn như:
 * - Hiển thị form (ví dụ: form đăng nhập hoặc đăng ký).
 * - Xác nhận hành động (ví dụ: "Bạn có chắc chắn muốn xóa?").
 * - Hiển thị thông báo hoặc chi tiết bổ sung.
 */

import React from 'react';
import './Modal.css'; // Tạo file CSS cho modal nếu cần

const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                {/* Xóa nút close-button */}
                {/* <button className="close-button" onClick={onClose}>X</button> */}
                {children}
            </div>
        </div>
    );
};

export default Modal;

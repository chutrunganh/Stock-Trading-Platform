import React from 'react';
import './AnnouncementBanner.css';

const AnnouncementBanner = () => (
  <div className="announcement-banner">
    <span className="announcement-icon" role="img" aria-label="stock">🔔 News</span>
    <div className="announcement-text-wrapper">      <span className="announcement-text">
        <span className="banner-company-name">Soict Stock</span>  Đầu tư an toàn, cuộc sống an nhàn &nbsp;&nbsp;&nbsp;●&nbsp;&nbsp;&nbsp;
           Ông Trump có thể giảm thuế với hàng Trung Quốc về 80%  &nbsp;&nbsp;&nbsp;●&nbsp;&nbsp;&nbsp;
          Cục Dự trữ liên bang Mỹ (Fed) giữ nguyên lãi suất trong phiên họp tháng 5, cảnh báo rủi ro lạm phát và thất nghiệp đang tăng. &nbsp;&nbsp;&nbsp;●&nbsp;&nbsp;&nbsp;
          Tỉ phú Warren Buffett bất ngờ tuyên bố sắp nghỉ hưu, đã chọn người kế nhiệm &nbsp;&nbsp;&nbsp;●&nbsp;&nbsp;&nbsp;
          Ấn Độ tấn công tên lửa vào Pakistan, thị trường dầu mỏ có rung chuyển? &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
      </span>
    </div>
  </div>
);

export default AnnouncementBanner; 
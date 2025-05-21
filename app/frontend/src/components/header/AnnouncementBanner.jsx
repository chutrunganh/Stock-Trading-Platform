import React from 'react';
import './AnnouncementBanner.css';

const AnnouncementBanner = () => (
  <div className="announcement-banner">
    <span className="announcement-icon" role="img" aria-label="stock">🔔 News</span>
    <div className="announcement-text-wrapper">      <span className="announcement-text">
        <span className="banner-company-name">Soict Stock</span>  Đầu tư an toàn, cuộc sống an nhàn &nbsp;&nbsp;&nbsp;●&nbsp;&nbsp;&nbsp;
        Sau vài phiên giảm, vàng quay lại mốc 3.300 USD một ounce, khi USD mất giá và nhu cầu trú ẩn của nhà đầu tư tăng cao  &nbsp;&nbsp;&nbsp;●&nbsp;&nbsp;&nbsp;
          Cục Dự trữ liên bang Mỹ (Fed) giữ nguyên lãi suất trong phiên họp tháng 5, cảnh báo rủi ro lạm phát và thất nghiệp đang tăng. &nbsp;&nbsp;&nbsp;●&nbsp;&nbsp;&nbsp;
          Chứng khoán ngày 20/5: Cổ phiếu trụ đồng thuận, VN-Index tăng hơn 18 điểm &nbsp;&nbsp;&nbsp;●&nbsp;&nbsp;&nbsp;
          EC hạ dự báo tăng trưởng của nền kinh tế lớn thứ ba Eurozone &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
      </span>
    </div>
  </div>
);

export default AnnouncementBanner; 
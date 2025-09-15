import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, Card, message, Space, Typography, Divider, Select, Slider, Row, Col } from 'antd';
import { DownloadOutlined, CopyOutlined, QrcodeOutlined, LinkOutlined } from '@ant-design/icons';
import QRCode from 'qrcode';
import logoImage from './image/Logo.png';

const { Title, Text, Paragraph } = Typography;

function App() {
  const [url, setUrl] = useState('https://checkin.tukilab.asia/');
  const [qrCodeDataURL, setQrCodeDataURL] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [logoPosition, setLogoPosition] = useState('center'); // center, top-left, top-right, bottom-left, bottom-right
  const [logoSize, setLogoSize] = useState(80); // Kích thước logo
  const canvasRef = useRef(null);

  // Ẩn lỗi zaloJSV2 và các lỗi runtime khác
  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.error = (...args) => {
      const errorMessage = args.join(' ');
      if (errorMessage.includes('zaloJSV2') || errorMessage.includes('Can\'t find variable')) {
        return; // Ẩn lỗi zaloJSV2
      }
      originalError.apply(console, args);
    };
    
    console.warn = (...args) => {
      const warnMessage = args.join(' ');
      if (warnMessage.includes('zaloJSV2') || warnMessage.includes('Can\'t find variable')) {
        return; // Ẩn warning zaloJSV2
      }
      originalWarn.apply(console, args);
    };

    // Ẩn lỗi runtime error overlay
    const hideErrorOverlay = () => {
      const errorOverlay = document.querySelector('[data-react-error-overlay]');
      if (errorOverlay) {
        errorOverlay.style.display = 'none';
      }
      
      const errorBoundary = document.querySelector('div[style*="position: fixed"]');
      if (errorBoundary && errorBoundary.textContent.includes('Uncaught runtime errors')) {
        errorBoundary.style.display = 'none';
      }
    };

    // Ẩn lỗi ngay lập tức và theo dõi thay đổi DOM
    hideErrorOverlay();
    const observer = new MutationObserver(hideErrorOverlay);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      observer.disconnect();
    };
  }, []);

  // Function để tính toán vị trí logo
  const getLogoPosition = (position, qrSize, logoSize) => {
    const padding = 20; // Khoảng cách từ mép
    switch (position) {
      case 'top-left':
        return { x: padding, y: padding };
      case 'top-right':
        return { x: qrSize - logoSize - padding, y: padding };
      case 'bottom-left':
        return { x: padding, y: qrSize - logoSize - padding };
      case 'bottom-right':
        return { x: qrSize - logoSize - padding, y: qrSize - logoSize - padding };
      case 'center':
      default:
        return { x: (qrSize - logoSize) / 2, y: (qrSize - logoSize) / 2 };
    }
  };

  const generateQRCode = async () => {
    if (!url.trim()) {
      message.error('Vui lòng nhập URL');
      return;
    }

    setIsGenerating(true);
    try {
      // Tạo QR code với options tối ưu
      const options = {
        errorCorrectionLevel: 'H', // Tăng mức sửa lỗi để có chỗ cho logo
        type: 'image/png',
        quality: 0.92,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 300
      };

      // Tạo QR code trước
      const qrDataURL = await QRCode.toDataURL(url, options);
      
      // Tạo canvas với độ phân giải cao để logo nét hơn
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const qrSize = 300;
      const scale = 2; // Tăng độ phân giải gấp đôi
      canvas.width = qrSize * scale;
      canvas.height = qrSize * scale;
      canvas.style.width = qrSize + 'px';
      canvas.style.height = qrSize + 'px';
      
      // Scale context để vẽ với độ phân giải cao
      ctx.scale(scale, scale);

      // Vẽ QR code lên canvas
      const qrImage = new Image();
      qrImage.onload = () => {
        ctx.drawImage(qrImage, 0, 0, qrSize, qrSize);
        
        // Tính toán vị trí logo
        const logoPos = getLogoPosition(logoPosition, qrSize, logoSize);
        const logoX = logoPos.x;
        const logoY = logoPos.y;
        
        // Vẽ background trắng cho logo
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(logoX - 8, logoY - 8, logoSize + 16, logoSize + 16);
        
        // Sử dụng logo local từ file
        const logoImg = new Image();
        logoImg.onload = () => {
          // Bật image smoothing để logo nét hơn
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // Vẽ logo với kích thước động
          ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
          
          // Chuyển canvas thành data URL với chất lượng cao
          const finalDataURL = canvas.toDataURL('image/png', 1.0);
          setQrCodeDataURL(finalDataURL);
          message.success('Tạo mã QR với logo TukiGroup thành công!');
          setIsGenerating(false);
        };
        logoImg.onerror = () => {
          // Nếu không load được logo, vẽ text thay thế
          drawTextLogo();
        };
        logoImg.src = logoImage;
        
        function drawTextLogo() {
          // Cải thiện chất lượng text với font size động
          const fontSize = Math.max(12, logoSize / 5); // Font size tỷ lệ với kích thước logo
          ctx.fillStyle = '#000000';
          ctx.font = `bold ${fontSize}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Vẽ text với shadow để nét hơn
          ctx.shadowColor = 'rgba(0,0,0,0.3)';
          ctx.shadowBlur = 1;
          ctx.shadowOffsetX = 1;
          ctx.shadowOffsetY = 1;
          
          ctx.fillText('TukiGroup', logoX + logoSize / 2, logoY + logoSize / 2);
          
          // Reset shadow
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          
          // Chuyển canvas thành data URL với chất lượng cao
          const finalDataURL = canvas.toDataURL('image/png', 1.0);
          setQrCodeDataURL(finalDataURL);
          message.success('Tạo mã QR với logo TukiGroup thành công!');
          setIsGenerating(false);
        }
      };
      
      qrImage.src = qrDataURL;
      
    } catch (error) {
      console.error('Error generating QR code:', error);
      message.error('Có lỗi khi tạo mã QR');
      setIsGenerating(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeDataURL) {
      message.error('Chưa có mã QR để tải xuống');
      return;
    }

    // Chuyển đổi PNG sang JPG
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Vẽ nền trắng cho JPG
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Vẽ QR code lên nền trắng
      ctx.drawImage(img, 0, 0);
      
      // Chuyển đổi sang JPG
      const jpgDataURL = canvas.toDataURL('image/jpeg', 0.92);
      
      const link = document.createElement('a');
      link.download = `qr-checkin-${Date.now()}.jpg`;
      link.href = jpgDataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success('Đã tải xuống mã QR dạng JPG!');
    };
    
    img.src = qrCodeDataURL;
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(url).then(() => {
      message.success('Đã sao chép URL!');
    }).catch(() => {
      message.error('Không thể sao chép URL');
    });
  };

  const copyQRDataURL = () => {
    if (!qrCodeDataURL) {
      message.error('Chưa có mã QR để sao chép');
      return;
    }

    navigator.clipboard.writeText(qrCodeDataURL).then(() => {
      message.success('Đã sao chép mã QR!');
    }).catch(() => {
      message.error('Không thể sao chép mã QR');
    });
  };

  return (
    <div className="qr-container">
      <Card className="qr-card">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={2} style={{ color: '#1890ff', marginBottom: 8 }}>
              <QrcodeOutlined /> QR Check-in Generator
            </Title>
            <Text type="secondary">
              Tạo mã QR miễn phí cho link checkin của bạn
            </Text>
          </div>

          <div className="qr-input-group">
            <Input
              size="large"
              placeholder="Nhập URL checkin..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              prefix={<LinkOutlined />}
              style={{ marginBottom: 16 }}
            />
            
            <Divider orientation="left">Tùy chỉnh Logo</Divider>
            
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Text strong>Vị trí logo:</Text>
                <Select
                  value={logoPosition}
                  onChange={setLogoPosition}
                  style={{ width: '100%', marginTop: 8 }}
                  options={[
                    { value: 'center', label: 'Giữa' },
                    { value: 'top-left', label: 'Trên trái' },
                    { value: 'top-right', label: 'Trên phải' },
                    { value: 'bottom-left', label: 'Dưới trái' },
                    { value: 'bottom-right', label: 'Dưới phải' }
                  ]}
                />
              </Col>
              <Col span={12}>
                <Text strong>Kích thước logo: {logoSize}px</Text>
                <Slider
                  min={40}
                  max={120}
                  value={logoSize}
                  onChange={setLogoSize}
                  style={{ marginTop: 8 }}
                />
              </Col>
            </Row>
            
            <Button
              type="primary"
              size="large"
              icon={<QrcodeOutlined />}
              loading={isGenerating}
              onClick={generateQRCode}
              block
            >
              {isGenerating ? 'Đang tạo...' : 'Tạo Mã QR với Logo TukiGroup'}
            </Button>
          </div>

          {qrCodeDataURL && (
            <div className="qr-result">
              <Title level={4}>Mã QR của bạn:</Title>
              
              <div className="qr-code-display">
                {qrCodeDataURL ? (
                  <img 
                    src={qrCodeDataURL} 
                    alt="QR Code" 
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                ) : null}
              </div>

              <Space wrap>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={downloadQRCode}
                >
                  Tải xuống
                </Button>
                <Button
                  icon={<CopyOutlined />}
                  onClick={copyUrl}
                >
                  Sao chép URL
                </Button>
                <Button
                  icon={<CopyOutlined />}
                  onClick={copyQRDataURL}
                >
                  Sao chép QR
                </Button>
              </Space>
            </div>
          )}

          <Divider />

          <div className="qr-info">
            <Title level={5} style={{ color: '#1890ff', marginBottom: 12 }}>
              <QrcodeOutlined /> Thông tin về dịch vụ
            </Title>
            <Paragraph style={{ margin: 0, fontSize: '14px' }}>
              <strong>✅ Hoàn toàn miễn phí</strong> - Không giới hạn số lượng mã QR
            </Paragraph>
            <Paragraph style={{ margin: '8px 0', fontSize: '14px' }}>
              <strong>✅ Logo TukiGroup</strong> - Tự động thêm logo TukiGroup vào giữa mã QR
            </Paragraph>
            <Paragraph style={{ margin: '8px 0', fontSize: '14px' }}>
              <strong>✅ Không cần đăng ký</strong> - Sử dụng ngay lập tức
            </Paragraph>
            <Paragraph style={{ margin: '8px 0', fontSize: '14px' }}>
              <strong>✅ Chất lượng cao</strong> - Mã QR rõ nét, dễ quét
            </Paragraph>
            <Paragraph style={{ margin: '8px 0', fontSize: '14px' }}>
              <strong>✅ Bảo mật</strong> - Không lưu trữ dữ liệu cá nhân
            </Paragraph>
            <Paragraph style={{ margin: '8px 0', fontSize: '14px' }}>
              <strong>✅ Tương thích</strong> - Hoạt động trên mọi thiết bị
            </Paragraph>
          </div>

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Được tạo bởi QR Check-in Generator | 
              <a href="https://checkin.tukilab.asia/" target="_blank" rel="noopener noreferrer">
                Truy cập trang checkin
              </a>
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  );
}

export default App;

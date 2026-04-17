import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST') ?? 'smtp.gmail.com',
      port: this.config.get<number>('SMTP_PORT') ?? 587,
      secure: false, // TLS
      auth: {
        user: this.config.get<string>('SMTP_USER'),
        pass: this.config.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendPasswordReset(to: string, name: string, resetUrl: string): Promise<void> {
    const from = this.config.get<string>('SMTP_FROM') ?? 'PhoneMarket <no-reply@phonemarket.vn>';

    const html = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Đặt lại mật khẩu</title>
      </head>
      <body style="margin:0;padding:0;background:#f5f3ff;font-family:sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
          <tr>
            <td align="center">
              <table width="480" cellpadding="0" cellspacing="0"
                style="background:#fff;border-radius:16px;border:1px solid #e9d5ff;overflow:hidden;">

                <!-- Header -->
                <tr>
                  <td style="background:#7c3aed;padding:28px 32px;text-align:center;">
                    <span style="font-size:24px;font-weight:900;color:#fff;letter-spacing:-1px;">
                      Phone<span style="color:#c4b5fd;">Market</span>
                    </span>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:36px 32px;">
                    <p style="margin:0 0 12px;font-size:16px;color:#1e1b4b;font-weight:700;">
                      Xin chào ${name},
                    </p>
                    <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;">
                      Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.
                      Nhấn nút bên dưới để tiếp tục. Link có hiệu lực trong <strong>1 giờ</strong>.
                    </p>

                    <div style="text-align:center;margin:28px 0;">
                      <a href="${resetUrl}"
                        style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;
                               font-size:15px;font-weight:700;padding:14px 36px;border-radius:50px;">
                        Đặt lại mật khẩu
                      </a>
                    </div>

                    <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;">
                      Hoặc copy link này vào trình duyệt:
                    </p>
                    <p style="margin:0 0 24px;font-size:12px;color:#7c3aed;word-break:break-all;">
                      ${resetUrl}
                    </p>

                    <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">
                      Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.
                      Tài khoản của bạn vẫn an toàn.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background:#f8f7ff;padding:16px 32px;text-align:center;
                             border-top:1px solid #e9d5ff;">
                    <p style="margin:0;font-size:12px;color:#94a3b8;">
                      © 2026 PhoneMarket · Hệ thống mua bán điện thoại tích hợp AI
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({ from, to, subject: 'Đặt lại mật khẩu PhoneMarket', html });
      this.logger.log(`Password reset email sent to ${to}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}`, err);
      throw err;
    }
  }
}

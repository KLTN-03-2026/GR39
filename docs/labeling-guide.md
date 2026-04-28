# Labeling Guide — iPhone Damage Detection Dataset

> Đọc kỹ TRƯỚC khi label. Mọi người trong team phải tuân theo cùng quy tắc để dataset nhất quán.

---

## Mục đích

Train YOLOv11 nhận diện:
1. **Generation iPhone** (gen_6 → gen_17) — 1 box duy nhất quanh body máy
2. **Damage** (crack/scratch/dent) — N box, mỗi vết hư 1 box

---

## 9 Class Generation

| Class | iPhone models | Đặc điểm phân biệt |
|---|---|---|
| `gen_6` | 6, 6s, 6+, 6s+, SE 1 | Vỏ nhôm bo tròn, Touch ID, jack 3.5mm |
| `gen_7_8` | 7, 7+, 8, 8+, SE 2, SE 3 | Touch ID, không jack. Plus = camera ngang |
| `gen_x_xs` | X, XR, XS, XS Max | Notch lớn lần đầu, Face ID |
| `gen_11` | 11, 11 Pro, 11 Pro Max | **Cụm camera VUÔNG** lần đầu xuất hiện |
| `gen_12_13` | 12 series + 13 series | Cạnh phẳng (vuông vức), notch nhỏ dần |
| `gen_14` | 14, 14+, 14 Pro, 14 Pro Max | Pro có **Dynamic Island** đầu tiên |
| `gen_15` | 15 series | Dynamic Island toàn dòng, USB-C, Pro = titan |
| `gen_16` | 16 series | Camera Control button (cạnh phải) |
| `gen_17` | 17, 17 Air, 17 Pro, 17 Pro Max | 2025+ |

**Quy tắc khi không chắc:**
- Title của tin có ghi rõ → tin tưởng title
- Ảnh không rõ + title không rõ → **skip ảnh đó**, không đoán bừa
- Nếu phân vân giữa 2 class liền kề (vd 14 vs 15 base) → check tựa tin có "USB-C" hay "Lightning"

---

## 4 Class Damage

### `crack` (nứt)
- Đường nứt rõ trên màn hình hoặc lưng kính (khi tắt màn hình)
- Hình dạng nhánh / mạng nhện / đường thẳng đậm
- ❌ KHÔNG phải: phim dán bị bong, vạch sáng do reflection, dust

### `scratch` (trầy)
- Vết xước dài, mảnh, bề mặt bị mài
- Thường thấy ở viền + lưng máy
- ❌ KHÔNG phải: vạch dài < 5 pixel, bóng đèn phản chiếu, dấu vân tay

### `dent` (cấn móp)
- Phần kim loại viền bị móp, lõm vào
- Thường ở 4 góc máy
- ❌ KHÔNG phải: design cong tự nhiên của body

### `screen_defect` (lỗi hiển thị màn hình) **— CHỈ KHI MÀN HÌNH ĐANG BẬT**
- **Sọc màn hình**: đường ngang/dọc bất thường khi màn hình hiển thị
- **Chấm mực / ink bleed**: vùng đen lan ra từ 1 điểm (do va đập áp suất)
- **Dead pixel**: chấm sáng hoặc đen cố định
- **Ám màu**: vùng màn hiển thị sai màu (hồng, vàng, xanh) so với phần còn lại
- **Burn-in**: bóng mờ icon còn lại sau khi đổi màn hình
- ❌ KHÔNG phải:
  - Reflection ánh sáng
  - Wallpaper user chọn (sọc trang trí)
  - Bụi trên kính protector
  - `crack` đã có sẵn (nếu có nứt + sọc cùng vùng → ưu tiên `crack`)
- ⚠️ **Quan trọng**: chỉ label được khi ảnh **chụp màn hình ĐANG BẬT**. Ảnh tắt màn hình → không thấy lỗi → skip

---

## Quy tắc vẽ box

### Box generation
- **1 box duy nhất** bao trọn body máy
- Bao sát viền body, không thừa nhiều background
- Nếu ảnh có **2 máy** (vd hộp + máy) → chỉ box máy chính
- Nếu chỉ thấy 1 phần máy (vd lưng) → vẫn box phần thấy được

### Box damage
- **1 vết hư = 1 box** (đừng gom nhiều vết vào 1 box to)
- Box vừa khít vết hư
- Bỏ vết quá nhỏ (< 5px) — không có ý nghĩa cho YOLO
- Vết liền kề rất gần nhau → có thể gom 1 box (judgment call)

---

## Ảnh nên SKIP (không label)

- Ảnh blur, mờ, không rõ máy
- Ảnh chụp xa, máy chiếm < 10% diện tích
- Ảnh phụ kiện (ốp, sạc, tai nghe) — không có máy thật
- Ảnh stock từ Apple website
- Ảnh chỉ thấy hộp, không có máy

---

## Tips tăng tốc với Auto-Label

1. **Always start with Auto-Label** — Roboflow đoán sẵn
2. Nếu auto-label đúng → bấm **Enter** ngay
3. Sai class → click box → chọn class trong sidebar (KHÔNG cần xoá box)
4. Sai vị trí → kéo cạnh box, không cần xoá vẽ lại
5. Thiếu damage → click "+" hoặc shortcut `B` → vẽ box mới
6. Hotkeys phải nhớ:
   - `Enter` — accept + next
   - `B` — vẽ box mới
   - `D` — delete selected box
   - `→` — next ảnh

---

## Quy trình QA (1 người làm)

Sau khi cả team label xong, **1 người làm QA** (chỉ định trước):
1. Filter ảnh "Recently labeled" → check ngẫu nhiên 50 ảnh / người
2. Nếu phát hiện inconsistency → gửi note + yêu cầu chỉnh
3. Roboflow có **Review Queue** — dùng tính năng này

---

## Checklist trước khi start label

- [ ] Đã đọc hết file này
- [ ] Đã thử label 5 ảnh thử trên Roboflow để quen UI
- [ ] Đã thống nhất với team về case ambiguous (vd 12 vs 13 base)
- [ ] Đã chia batch ảnh qua Annotation Jobs
- [ ] Đã setup hotkey trong Roboflow Settings

---

## Khi nào ESCALATE (báo team lead)

- Ảnh có 2 máy khác generation cùng frame → hỏi
- Damage khó phân loại (crack vs scratch) → chụp screenshot, hỏi
- Title tin và ảnh mâu thuẫn rõ rệt → flag ảnh, không label

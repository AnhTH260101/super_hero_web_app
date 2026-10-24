---
name: game-data-mining
description: >-
  Quy trình chuẩn đào dữ liệu game, phân tích tính năng, sự kiện và trích xuất drop table/vật phẩm từ source code và config gốc. Sử dụng khi người dùng yêu cầu viết hướng dẫn sự kiện game, đào danh sách vật phẩm, tìm kiếm cơ chế tính năng hoặc khi làm việc với bất kỳ tựa game mới nào.
---

# Game Data Mining & Feature Analysis Skill (Quy Trình Đào Dữ Liệu Game Chuẩn)

Kỹ năng này thiết lập quy trình chuẩn mực và kỷ luật bắt buộc khi phân tích, đào bới dữ liệu và viết hướng dẫn cho mọi tựa game (kể cả game hiện tại hay bất kỳ game mới nào trong tương lai).

## NGUYÊN TẮC BẤT DI BẤT DỊCH
> [!CAUTION]
> **SOURCE CODE LÀ CHÂN LÝ TỐI THƯỢNG (SOURCE OF TRUTH FIRST)**
> 1. **TUYỆT ĐỐI KHÔNG** bắt đầu bằng cách tìm kiếm trong thư viện ảnh (`public/`, ảnh tải lên) rồi suy đoán ngược lại tên và cơ chế sự kiện. Tên file ảnh có thể bị đặt nhầm, trùng lặp hoặc thuộc về sự kiện khác.
> 2. **BẮT BUỘC** phải truy vết từ **Mã nguồn, File Cấu Hình (Config), File Ngôn Ngữ (Translations) và Script Logic** của game trước. Chỉ khi đã nắm rõ ID, Tên chuẩn và Bảng phần thưởng gốc mới tìm ảnh tương ứng để minh họa.
> 3. **LUÔN DỰA TRÊN PHIÊN BẢN MỚI NHẤT (LATEST VERSION FIRST)**: Đối với các game vận hành lâu năm (5 - 10+ năm), các file config thường lưu trữ lũy kế toàn bộ lịch sử các version từ thời sơ khai (server ngày 1 đến ngày 3000+). **BẮT BUỘC phải lọc theo các key phiên bản mới nhất / hiện hành**, tuyệt đối không quét gộp tất cả các version khiến dữ liệu cổ xưa / tướng rác đã bị gỡ bị lẫn vào hướng dẫn hiện tại.

---

## QUY TRÌNH 4 BƯỚC THỰC HIỆN

### Bước 1: Định Danh Sự Kiện & Truy Vết Source Code (Identification)
1. **Tìm kiếm tên sự kiện qua bảng chuỗi/ngôn ngữ**:
   - Quét qua các file dịch thuật, từ điển hoặc bảng config: `master_config_translations.json`, `string_injection_map.json`, `lua_ui_translations.json`, `arsc_login_strings.json`.
   - Tìm kiếm tên tiếng Việt, tiếng Anh và tiếng gốc (Trung/Nhật nếu có, ví dụ: 夺宝 = Đoạt Bảo, 迷宫 = Mê Cung, 一元夺宝 = Raiders...).
2. **Xác định đúng file Config & Script chịu trách nhiệm**:
   - Tra cứu mapping trong `game_config.lua`, `config/`, `assets/config/`.
   - Tìm UI Controller/Pop-up tương ứng (ví dụ: `game_indiana_pop.lua`, `game_indianaPan_pop.lua`, `game_pirate_precious.lua`...).

### Bước 2: Đào Sâu Logic, Tỷ Lệ & Drop Table (Logic & Data Extraction)
1. **Giải mã & Phân tích cấu trúc file dữ liệu**:
   - Nếu file bị đóng gói (APK, ZIP, PAK): Trích xuất file `.config` hoặc asset gốc bằng công cụ giải nén.
   - Nếu file script bị mã hóa (XXTEA, Lua bytecode...): Dùng khóa giải mã tương ứng để đọc mã nguồn (ví dụ XXTEA với key b"aaa").
2. **Trích xuất thông số cốt lõi**:
   - **Chi phí tham gia**: Xu, Kim cương, Thể lực, lượt miễn phí mỗi ngày (`one_coin`, `ten_coin`, `free_times`...).
   - **Cơ chế tiền tệ phụ**: Điểm tích lũy, Chìa khóa, Huy hiệu... và cơ chế bảo lưu (**Tồn tại vĩnh viễn** hay **Bị reset/xóa khi hết hạn**).
   - **Bảng giải thưởng (Drop Table / Rate Table)**: Danh mục ID vật phẩm, thẻ tướng, số lượng, tỷ lệ xuất hiện (`rate`, `common_reward`, `limit_reward`).
   - **Bảng đổi thưởng (Shop Exchange)**: Danh mục các món đổi, giá tiền tệ, giới hạn mua (`limit_num`, `need_key_num`).

### Bước 3: Ánh Xạ ID Sang Tên & Ảnh Chuẩn (ID Resolution & Asset Mapping)
1. **Phân giải mọi ID thành tên rõ ràng**:
   - ID tướng: Tra qua `character_detail.config` -> Tên tướng, Phẩm chất (SSR/UR), Hệ nguyên tố.
   - ID vật phẩm: Tra qua `item.config` -> Tên vật phẩm, Công dụng.
   - ID pháp bảo/trang bị: Tra qua `talisman.config`, `equip.config`.
2. **Khớp nối hình ảnh minh họa**:
   - Tìm icon theo đúng đường dẫn ID đã xác định.
   - Kiểm tra ảnh chụp màn hình thực tế: Tiêu đề trên ảnh PHẢI KHỚP CHÍNH XÁC với tên sự kiện đang viết (ví dụ: "Bản đồ kho báu Vua hải tặc" khác hoàn toàn với "Kho báu mê cung").

### Bước 4: Kiểm Chứng & Biên Soạn (Validate & Document)
1. **Kiểm tra tính nhất quán**:
   - Tên sự kiện trong bài viết có khớp 100% với tên trên giao diện game không?
   - Cơ chế đã được đối chiếu với code chưa (có mẹo chơi thực tế như nút làm mới, tích lũy điểm hay không)?
2. **Xuất bản nội dung chuẩn mực**:
   - Cung cấp đầy đủ bảng Drop Table và Bảng Shop.
   - Nêu rõ lời khuyên phân bổ ngân sách cho người chơi F2P (cày chay) và P2W (nạp tiền).

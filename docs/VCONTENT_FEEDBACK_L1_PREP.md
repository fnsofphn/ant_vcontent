# VContent Feedback L1 - Prep Backlog

## 1. Mục tiêu của đợt chuẩn bị

Tài liệu này tổng hợp feedback trong file `E:/2026/Vcontent_Feedback L1 (1004).docx` và map vào repo hiện tại để triển khai dần theo từng đợt nhỏ, tránh sửa lan man hoặc chạm vào các thay đổi đang dở.

## 2. Tóm tắt feedback đã trích

### 2.1. Đổi logic tạo đơn hàng

- Không để "khách hàng tạo đơn hàng" như flow hiện tại.
- Đơn hàng mới nên do `PM` hoặc `Admin nội dung` khởi tạo.
- Flow nghiệp vụ mong muốn:
  - Khách hàng có nhu cầu dự án.
  - Sale xử lý cơ hội, báo giá, hợp đồng.
  - Khi đủ điều kiện, Sale chuyển nội dung cho PM và Admin nội dung.
  - PM/Admin nội dung tạo đơn hàng mới trên hệ thống.

### 2.2. Tổ chức lại IA màn hình

Cần quy về 3 tab/cụm chính:

- `Quản lý đơn hàng`
- `Kế hoạch sản xuất`
- `Thư viện sản phẩm` (để sau)

### 2.3. Tab Quản lý đơn hàng

Cần có:

- KPI tổng quan:
  - Tổng số đơn hàng
  - Tổng số sản phẩm
  - Tổng số dự án
- Bảng danh sách đơn hàng với các cột:
  - Mã đơn hàng
  - Tên đơn hàng
  - Loại: `E/H/G/M`
  - Khách hàng
  - Số sản phẩm
  - Hạn hoàn thành
  - Trạng thái: `Chưa bắt đầu / Đang thực hiện / Quá hạn / Pending / Hoàn thành`
  - Checkpoint
  - Cột `View chi tiết đơn hàng`
- Có ghi chú/note của PM ở cấp order.

### 2.4. Tab Kế hoạch sản xuất

Cần có:

- Dashboard KPI:
  - Số sản phẩm đang sản xuất
  - Số sản phẩm hoàn thành
  - Số sản phẩm quá hạn
  - Số sản phẩm pending
  - Số sản phẩm chưa sản xuất (số lượng + %)
- Bảng sản phẩm với các cột:
  - Mã sản phẩm
  - Mã đơn hàng
  - Tên sản phẩm
  - Loại sản phẩm `H/E/G/M`
  - Ngày bắt đầu
  - Deadline
  - Phụ trách
  - Trạng thái 5 mức
  - Checkingpoint / View chi tiết quy trình
- Checkpoint cần thể hiện các bước:
  - Yêu cầu đầu vào
  - Storyboard
  - Slide
  - QC slide
  - Thu voice
  - QC voice
  - Biên tập
  - QC video
  - Scorm + Quizz

### 2.5. Màn Tạo đơn hàng mới

Cần đổi thành màn do `PM/Admin nội dung` khởi tạo, gồm các trường:

- Tên đơn hàng
- Mã đơn hàng (nhập tay, có gợi ý AI)
- Thời hạn hoàn thành
- Khách hàng
- Mã dự án
- Mức độ ưu tiên: `Cao / Trung bình / Thấp`
- Tổng sản phẩm
- Loại `E/H/G/M`
- Danh sách sản phẩm:
  - Mã sản phẩm
  - Tên sản phẩm
  - Ghi chú
- Tự sinh mã sản phẩm từ mã đơn hàng
- Import tài liệu/nội dung liên quan
- Đổi nút `Gửi duyệt` thành `Khởi tạo đơn hàng`

### 2.6. Danh mục đơn hàng theo module

Trước khi vào từng công đoạn, cần có danh mục đơn hàng theo loại:

- Danh mục đơn hàng `E`
- Danh mục đơn hàng `G`
- Danh mục đơn hàng `M`
- Danh mục đơn hàng `H`

Khi click 1 đơn hàng, mở ra cửa sổ tiến trình các bước sản xuất.

### 2.7. Làm lại giao diện chi tiết quy trình

Dashboard chi tiết sản phẩm cần hiện:

- Mã sản phẩm + tên sản phẩm
- Link mã đơn hàng
- Thanh tiến trình bước sản xuất và highlight bước hiện tại
- Mô tả đầu vào tối thiểu
- Phụ trách
- Thời hạn hoàn thành
- Tài liệu/nội dung đính kèm + danh sách file
- Ghi chú nhập tay

## 3. Map vào repo hiện tại

### 3.1. Navigation / IA / role access

Files chính:

- [src/data/vcontent.ts](/E:/tool/01.%20CODE/vcontent/vcontent-main/vcontent-3.0/src/data/vcontent.ts)
- [src/pages/WorkspacePage.tsx](/E:/tool/01.%20CODE/vcontent/vcontent-main/vcontent-3.0/src/pages/WorkspacePage.tsx)
- [src/components/layout/Sidebar.tsx](/E:/tool/01.%20CODE/vcontent/vcontent-main/vcontent-3.0/src/components/layout/Sidebar.tsx)

Tình trạng hiện tại:

- IA vẫn còn nhóm `Client`.
- Có page `client-new-order` và logic "khách hàng tạo đơn".
- PM flow đang tách thành `producer-inbox`, `producer-launch`, `order-pm-dashboard`.

Tác động dự kiến:

- Đổi nhận diện `Client` sang flow nội bộ sản xuất.
- Gom lại các page theo 3 cụm lớn: `Quản lý đơn hàng`, `Kế hoạch sản xuất`, `Thư viện sản phẩm`.
- Xác định role nào được tạo đơn: `pm`, `admin`, có thêm `admin_noi_dung` nếu cần.

### 3.2. Order management / create order

Files chính:

- [src/pages/ClientNewOrderPage.tsx](/E:/tool/01.%20CODE/vcontent/vcontent-main/vcontent-3.0/src/pages/ClientNewOrderPage.tsx)
- [src/pages/OperationsPages.tsx](/E:/tool/01.%20CODE/vcontent/vcontent-main/vcontent-3.0/src/pages/OperationsPages.tsx)
- [src/services/vcontent.ts](/E:/tool/01.%20CODE/vcontent/vcontent-main/vcontent-3.0/src/services/vcontent.ts)

Tình trạng hiện tại:

- Form tạo đơn chưa có mã đơn, mã dự án, ưu tiên, ghi chú theo từng sản phẩm.
- Nút submit hiện là `Gửi duyệt`.
- `createClientOrder()` đang nhận `bundleCounts` theo `ELN/VIDEO/GAME`.

Tác động dự kiến:

- Đổi tên/logic page tạo đơn.
- Mở rộng payload tạo order và product.
- Thêm upload tài liệu intake/order.
- Chuẩn hóa mã đơn, mã sản phẩm, note sản phẩm.

### 3.3. Planning / production board

Files chính:

- [src/pages/PlanningPage.tsx](/E:/tool/01.%20CODE/vcontent/vcontent-main/vcontent-3.0/src/pages/PlanningPage.tsx)
- [src/pages/OperationsPages.tsx](/E:/tool/01.%20CODE/vcontent/vcontent-main/vcontent-3.0/src/pages/OperationsPages.tsx)
- [src/services/vcontent.ts](/E:/tool/01.%20CODE/vcontent/vcontent-main/vcontent-3.0/src/services/vcontent.ts)

Tình trạng hiện tại:

- Đã có planning page, nhưng theo hướng timeline/workflow module nội bộ.
- Chưa có màn danh sách sản phẩm đúng với KPI và cột theo feedback.

Tác động dự kiến:

- Thêm view `Kế hoạch sản xuất` theo product-first.
- Bổ sung KPI và filter theo deadline/ưu tiên/trạng thái.
- Thêm "view chi tiết quy trình" từ bảng planning.

### 3.4. Stage detail / workflow detail dashboard

Files chính:

- [src/pages/StoryboardStagePages.tsx](/E:/tool/01.%20CODE/vcontent/vcontent-main/vcontent-3.0/src/pages/StoryboardStagePages.tsx)
- [src/pages/ProductionStagePages.tsx](/E:/tool/01.%20CODE/vcontent/vcontent-main/vcontent-3.0/src/pages/ProductionStagePages.tsx)
- [src/lib/workflowTasks.ts](/E:/tool/01.%20CODE/vcontent/vcontent-main/vcontent-3.0/src/lib/workflowTasks.ts)
- [src/services/vcontent.ts](/E:/tool/01.%20CODE/vcontent/vcontent-main/vcontent-3.0/src/services/vcontent.ts)

Tình trạng hiện tại:

- Đã có stage pages và workflow record.
- Chưa có một dashboard thống nhất theo đúng mẫu feedback: progress bar, note, attachment list, deadline đề xuất, link order.

Tác động dự kiến:

- Tạo 1 layout detail dùng chung cho sản phẩm/workflow.
- Đưa thông tin order + product + input + attachment + note vào cùng 1 màn hình.
- Dùng lại cho các module `E/H/G/M` sau khi chốt mapping.

### 3.5. Data model / Supabase

Files chính:

- [src/services/vcontent.ts](/E:/tool/01.%20CODE/vcontent/vcontent-main/vcontent-3.0/src/services/vcontent.ts)
- [supabase/migrations](/E:/tool/01.%20CODE/vcontent/vcontent-main/vcontent-3.0/supabase/migrations)

Tình trạng hiện tại:

- `OrderRow` và `ProductRow` chưa thể hiện đầy đủ các field mới.
- Hệ thống đang dùng `ELN/VIDEO/GAME`, chưa có `M`.
- Trạng thái hiện tại chi tiết hơn feedback, nhưng không map 1-1 với 5 trạng thái mới.

Khả năng cần thay đổi:

- `orders`
  - order_code
  - project_code
  - priority
  - order_type
  - checkpoint summary
- `products`
  - product_code
  - product_note
  - planned_start_date
  - owner/profile
  - normalized_status
- `assets/input items`
  - file đính kèm cấp order/product

## 4. Khoảng cách giữa feedback và hệ thống hiện tại

### 4.1. Mapping module đang bị lệch

Feedback mới dùng:

- `E`
- `H`
- `G`
- `M`

Repo hiện tại dùng:

- `ELN`
- `VIDEO`
- `GAME`

Cần chốt sớm:

- `H` map vào `VIDEO` hiện tại hay là 1 loại mới?
- `E` có phải đang khác `ELN` hiện tại không?
- `M` là module mới hay 1 biến thể của `VIDEO`?

Nếu không chốt sớm, việc sửa form tạo đơn, route module, KPI và stage mapping sẽ dễ bị làm lại.

### 4.2. Mapping trạng thái đang bị lệch

Feedback muốn 5 trạng thái tổng quát:

- Chưa bắt đầu
- Đang thực hiện
- Quá hạn
- Pending
- Hoàn thành

Repo hiện tại đang có nhiều status vận hành chi tiết hơn:

- submitted
- changes_requested
- ready_for_launch
- in_production
- ready_delivery
- paid
- ...

Hướng xử lý dự kiến:

- Giữ status chi tiết cho máy/logic.
- Thêm `display status` tổng hợp cho bảng order/product.

### 4.3. Checkpoint chưa rõ mức độ chi tiết

Cần chốt:

- Checkpoint là cột tổng hợp theo percent?
- Hay là popup timeline từng bước?
- Hay là summary count `done/pending/overdue`?

Đề xuất kỹ thuật:

- Làm 1 component checkpoint summary trong bảng.
- Click vào thì mở detail workflow drawer/modal.

## 5. Thứ tự triển khai đề xuất

### Phase 1 - Chốt ngôn ngữ nghiệp vụ + đổi IA tối thiểu

- Đổi label/menu để bỏ flow `client tạo đơn`.
- Đổi page tạo đơn thành page nội bộ cho PM/Admin.
- Định nghĩa mapping tạm thời giữa module cũ và module mới.
- Chốt display status tổng hợp.

### Phase 2 - Refactor màn Tạo đơn hàng

- Bổ sung các field mới trên form.
- Sinh mã sản phẩm từ mã đơn hàng.
- Đổi nút thành `Khởi tạo đơn hàng`.
- Cập nhật service tạo order/product.

### Phase 3 - Tab Quản lý đơn hàng

- Tạo bảng order đúng cột.
- Thêm KPI tổng hợp.
- Thêm view chi tiết đơn hàng.

### Phase 4 - Tab Kế hoạch sản xuất

- Tạo bảng product đúng cột.
- Thêm KPI, filter thời gian, filter deadline, owner, status.
- Thêm checkpoint summary + link detail workflow.

### Phase 5 - Dashboard chi tiết quy trình

- Làm lại layout detail sản phẩm/workflow.
- Hiện progress bar, input tối thiểu, note, attachment, deadline, phụ trách.

### Phase 6 - Thư viện sản phẩm

- Để sau, sau khi order/planning/workflow đã ổn.

## 6. Điểm cần chốt trước khi code sâu rộng

1. Mapping chính xác giữa `ELN/VIDEO/GAME` và `E/H/G/M`.
2. Có cần module mới `M` ngay trong đợt này không.
3. `Admin nội dung` có là role mới hay tạm dùng chung `admin/pm`.
4. `Checkpoint` hiện theo drawer/modal hay sang trang detail riêng.
5. Có cần lưu file đính kèm cấp `order` hay có thể tận dụng `input items` tạm thời.

## 7. Đề xuất slice đầu tiên khi bắt đầu làm

Slice nên làm đầu tiên:

- Đổi IA + label + role access tối thiểu.
- Chuyển `ClientNewOrderPage` thành màn `Khởi tạo đơn hàng`.
- Chốt payload order/product mới ở mức front-end và service.

Lý do:

- Đây là điểm gốc của feedback.
- Nếu chưa đổi slice này, các màn planning và workflow sau đó sẽ tiếp tục dựa trên mô hình cũ.
- Slice này có thể làm rồi verify UI trước, sau đó mới mở rộng sang bảng order/planning.

## 8. Lưu ý cho đợt làm tiếp theo

- Repo hiện đang có uncommitted changes trong:
  - `src/index.css`
  - `src/lib/lecturerAssessment.ts`
  - `src/pages/LecturerQuestionBankPage.tsx`
  - `src/pages/PublicLecturerAssessmentPage.tsx`
- Khi triển khai các phase trên, cần tránh ghi đè lên các file này nếu không liên quan.

export const SH = [
  { id: 'sh1', v: 'Hộ cư dân thông thường' },
  { id: 'sh2', v: 'Chung cư, Khu đô thị mới' },
  { id: 'sh3', v: 'Hộ nghèo, cận nghèo, gia đình chính sách' },
  { id: 'sh4', v: 'Người cao tuổi sống một mình, người khuyết tật' },
  { id: 'sh5', v: 'Hộ dân vùng sâu, vùng xa, hải đảo' },
  { id: 'sh6', v: 'Hộ dân có nhu cầu chuyển dịch năng lượng' },
];

export const NSH = [
  { id: 'nsh1', v: 'Doanh nghiệp sản xuất vừa và nhỏ' },
  { id: 'nsh2', v: 'Doanh nghiệp, Tập đoàn lớn trong nước' },
  { id: 'nsh3', v: 'Doanh nghiệp có vốn đầu tư nước ngoài (FDI)' },
  { id: 'nsh4', v: 'Hộ sản xuất kinh doanh cá thể, tiểu thương' },
  { id: 'nsh5', v: 'Cơ quan hành chính, trường học, bệnh viện' },
  { id: 'nsh6', v: 'Doanh nghiệp chuyển dịch năng lượng' },
];

export const ALL = [...SH, ...NSH];

export const JR = [
  {
    id: 'j1',
    l: 'Cấp điện mới',
    d: 'Toàn bộ quy trình từ khi khách hàng có nhu cầu sử dụng điện đến khi đóng điện. Căn cứ: Điều 9-10 QT KD EVNSPC.',
    s: ALL.map((x) => x.id),
    tp: [
      {
        id: 't1',
        n: '1.1 Tìm kiếm thông tin dịch vụ cấp điện',
        ds: 4,
        is: ['Khách hàng không biết liên hệ ai, qua kênh nào', 'Thông tin trên website/app khó tìm', 'Tổng đài bận, chờ lâu', 'Nhân viên trả lời không đầy đủ, phải gọi lại nhiều lần'],
      },
      {
        id: 't2',
        n: '1.2 Liên hệ tổng đài / đến quầy giao dịch',
        ds: 4,
        is: ['Chờ lâu mới được tiếp nhận (chuẩn: dưới 20 giây)', 'ĐTV không khai thác đủ thông tin', 'Không phân biệt khách hàng cần hạ áp hay trung áp', 'Không hướng dẫn hồ sơ đầy đủ ngay lần đầu'],
      },
      {
        id: 't3',
        n: '1.3 Nhân viên tư vấn quy trình và tiếp nhận hồ sơ',
        ds: 4,
        is: ['Nhân viên tư vấn hời hợt, không giải thích rõ', 'Hồ sơ phức tạp, bổ sung nhiều lần', 'Thái độ thiếu kiên nhẫn', 'Không hướng dẫn đầy đủ cho khách hàng lớn tuổi'],
      },
      {
        id: 't4',
        n: '1.4 Nộp hồ sơ (trực tuyến hoặc trực tiếp)',
        ds: 3,
        is: ['Khó khăn ký hợp đồng điện tử với người lớn tuổi', 'Yêu cầu bổ sung giấy tờ gây mất thời gian', 'Hệ thống trực tuyến lỗi'],
      },
      {
        id: 't5',
        n: '1.5 Nhân viên khảo sát hiện trường',
        ds: 3,
        is: ['Trễ hẹn không báo trước', 'Thái độ vội vã, không giải thích phương án', 'Không giới thiệu bản thân, không xuất trình thẻ', 'Dùng thuật ngữ chuyên ngành Khách hàng không hiểu'],
      },
      {
        id: 't6',
        n: '1.6 Lập phương án và báo giá (trung áp)',
        ds: 3,
        is: ['Chi phí không minh bạch, phát sinh ngoài dự kiến', 'Thời gian ra báo giá chậm', 'Nhân viên không giải thích ranh giới phân định tài sản'],
      },
      {
        id: 't7',
        n: '1.7 Ký HĐMBĐ và thanh toán chi phí',
        ds: 3,
        is: ['Hợp đồng điện tử khó thao tác với người lớn tuổi', 'Nhân viên không giải thích rõ các khoản phí', 'Khách hàng không hiểu các điều khoản pháp lý'],
      },
      {
        id: 't8',
        n: '1.8 Thi công lắp đặt',
        ds: 4,
        is: ['Trễ tiến độ, không thông báo', 'Gây ảnh hưởng sinh hoạt/kinh doanh', 'Không dọn dẹp sau thi công'],
      },
      {
        id: 't9',
        n: '1.9 Đóng điện, bàn giao và hướng dẫn',
        ds: 3,
        is: ['Không hướng dẫn cài app CSKH', 'Không thông tin quyền lợi và kênh liên hệ', 'Không hỏi thăm sau đóng điện'],
      },
    ],
  },
  {
    id: 'j2',
    l: 'Quản lý sử dụng điện và Thanh toán tiền điện, thu phí dịch vụ',
    d: 'Ghi chỉ số, hóa đơn, thanh toán, kiểm tra công tơ, ngừng CCĐ do nợ. Căn cứ: Phần V-VII QT KD.',
    s: ALL.map((x) => x.id),
    tp: [
      {
        id: 't1',
        n: '2.1 Nhân viên ghi chỉ số công tơ',
        ds: 3,
        is: ['Nhân viên vào nhà khách hàng không hẹn trước', 'Sản lượng ghi nhận không khớp thực tế', 'Khách hàng vắng — Nhân viên tạm tính mà không thông báo', 'Không cho khách hàng biết kết quả ghi chỉ số'],
      },
      {
        id: 't2',
        n: '2.2 Kiểm tra / Kiểm định công tơ',
        ds: 3,
        is: ['Khách hàng không hiểu tại sao phải thay công tơ định kỳ', 'Nhân viên thay công tơ không hẹn trước, không giải thích', 'Khách hàng nghi ngờ công tơ mới chạy nhanh hơn', 'Kết quả kiểm định không được giải thích rõ'],
      },
      {
        id: 't3',
        n: '2.3 Lập và phát hành hóa đơn',
        ds: 5,
        is: ['Hóa đơn tăng bất thường', 'Khách hàng không hiểu cơ chế giá bậc thang', 'Chuyển phiên ghi dẫn đến số ngày tính tăng', 'Không nhận được hóa đơn đúng kỳ'],
      },
      {
        id: 't4',
        n: '2.4 Khách hàng nhận thông báo thanh toán',
        ds: 4,
        is: ['App CSKH bị lỗi khi truy cập đông', 'Khách hàng không có điện thoại thông minh', 'Thông báo SMS/Zalo đôi khi không nhận', 'Thông tin hóa đơn dùng thuật ngữ kỹ thuật'],
      },
      {
        id: 't5',
        n: '2.5 Thanh toán tiền điện qua các kênh',
        ds: 4,
        is: ['Ứng dụng thanh toán khó dùng, khó thao tác, không có thông báo rõ ràng', 'Lỗi hệ thống — trừ tiền nhưng chưa ghi nhận', 'Thanh toán rồi vẫn báo nợ', 'Ít lựa chọn về phương thức và hình thức thanh toán'],
      },
      {
        id: 't6',
        n: '2.6 Ngừng cấp điện do nợ',
        ds: 5,
        is: ['Cắt điện không thông báo đầy đủ theo trình tự', 'Khách hàng đã thanh toán nhưng bị cắt do lỗi đồng bộ', 'Nhân viên thái độ lạnh lùng khi đến cắt điện', 'Không cập nhật CMIS nên tổng đài không biết'],
      },
      {
        id: 't7',
        n: '2.7 Cấp điện trở lại sau thanh toán nợ',
        ds: 4,
        is: ['Chậm cấp lại sau thanh toán', 'Nhân viên không xin lỗi sau khi cắt nhầm', 'Khách hàng phải gọi nhiều lần hỏi khi nào có điện lại'],
      },
      {
        id: 't8',
        n: '2.8 Khiếu nại hóa đơn tiền điện',
        ds: 4,
        is: ['Quy trình giải quyết chậm (chuẩn: 3 ngày)', 'Kết quả không thỏa đáng', 'Nhân viên coi thường thắc mắc khách hàng'],
      },
    ],
  },
  {
    id: 'j3',
    l: 'Xử lý sự cố mất điện',
    d: 'Ngừng giảm kế hoạch + sự cố đột xuất. Căn cứ: QĐ 2286 Phụ lục III, Điều 26 QT KD, Thông tư 04/2025.',
    s: ['sh1', 'sh2', 'sh3', 'sh4', 'sh5', 'nsh1', 'nsh2', 'nsh3', 'nsh5'],
    tp: [
      {
        id: 't1',
        n: '3.1 Thông báo ngừng giảm CCĐ kế hoạch',
        ds: 4,
        is: ['Khách hàng không nhận được thông báo trước (chuẩn: 5 ngày)', 'Thời gian mất điện thực tế dài hơn thông báo', 'Không thông báo riêng cho khách hàng quan trọng (Thông tư 22/2020)'],
      },
      {
        id: 't2',
        n: '3.2 Khách hàng phát hiện mất điện đột ngột (sự cố)',
        ds: 5,
        is: ['Không biết nguyên nhân và thời gian khôi phục', 'Tin nhắn hoặc ứng dụng thông báo bị chậm hoặc không nhận được', 'Khách hàng có thiết bị y tế cần xử lý khẩn cấp'],
      },
      {
        id: 't3',
        n: '3.3 Khách hàng liên hệ tổng đài / app báo sự cố',
        ds: 5,
        is: ['Tổng đài bận (đặc biệt sự cố trên 5.000 KH)', 'ĐTV tra OMS nhưng Đơn vị chưa cập nhật', 'Khách hàng không biết mã khách hàng, chậm tra cứu', 'Kênh báo trên app không hoạt động tốt'],
      },
      {
        id: 't4',
        n: '3.4 Đơn vị tiếp nhận phiếu CRM (chuẩn: 10 phút)',
        ds: 4,
        is: ['Đơn vị không tiếp nhận đúng 10 phút', 'Mất kết nối điện thoại IP', 'Nhân viên không liên hệ khách hàng trong 30 phút theo quy định'],
      },
      {
        id: 't5',
        n: '3.5 Nhân viên kiểm tra, sửa chữa tại hiện trường',
        ds: 5,
        is: ['Không có thông tin về lịch trình, kế hoạch sửa chữa rõ ràng', 'Thời gian chờ kéo dài, bức xúc cao', 'Nhân viên không chủ động cập nhật tiến độ', 'Nhân viên dùng thuật ngữ kỹ thuật', 'Sự cố trên tài sản khách hàng — Nhân viên bỏ đi không hỗ trợ'],
      },
      {
        id: 't6',
        n: '3.6 Hoàn tất / Đóng phiếu (3 TH theo QĐ 2286)',
        ds: 4,
        is: ['Đóng phiếu khi chưa liên hệ khách hàng xin đồng ý', 'Quá 2h nhưng không liên hệ khách hàng thỏa thuận', 'Sự cố diện rộng nhưng không lập OMS trong 30 phút', 'Không ghi rõ lý do vào phiếu'],
      },
      {
        id: 't7',
        n: '3.7 Theo dõi sau khôi phục điện',
        ds: 3,
        is: ['Không hỏi thăm khách hàng sau sự cố', 'Không giải thích nguyên nhân chính thức', 'Không hướng dẫn quyền lợi bồi thường'],
      },
    ],
  },
  {
    id: 'j4',
    l: 'Thay đổi trong quá trình sử dụng điện',
    d: 'Thay đổi công suất, di dời điện kế, chủ thể HĐMBĐ, mục đích sử dụng điện, ngừng/cấp lại, dịch vụ sau công tơ. Căn cứ: Điều 12-21 QT KD.',
    s: ALL.map((x) => x.id),
    tp: [
      {
        id: 't1',
        n: '4.1 Khách hàng liên hệ yêu cầu thay đổi',
        ds: 3,
        is: ['Khách hàng không biết gửi yêu cầu qua kênh nào', 'Nhân viên không phân biệt được loại dịch vụ phù hợp', 'Không hướng dẫn hồ sơ đầy đủ ngay lần đầu', 'Khách hàng không hiểu sự khác biệt giữa các loại thay đổi'],
      },
      {
        id: 't2',
        n: '4.2 Nhân viên tư vấn quy trình và hồ sơ',
        ds: 4,
        is: ['Nhân viên hướng dẫn sơ sài, khách hàng phải đi lại 2-3 lần', 'Thay đổi chủ thể do mua nhà — quy trình 15 ngày chờ, Nhân viên không giải thích', 'Khách hàng lắp thêm máy lạnh phải tăng công suất — không hiểu tại sao', 'Thay đổi mục đích sử dụng điện — không biết ảnh hưởng giá điện'],
      },
      {
        id: 't3',
        n: '4.3 Nhân viên khảo sát hiện trường (thay đổi công suất, di dời)',
        ds: 3,
        is: ['Trễ hẹn — Khách hàng phiền phức, mất niềm tin', 'Nhân viên không giải thích phương án kỹ thuật dễ hiểu', 'Không giới thiệu bản thân, không xuất trình thẻ', 'Nhân viên vội vã, không lắng nghe yêu cầu khách hàng'],
      },
      {
        id: 't4',
        n: '4.4 Thực hiện thay đổi (thi công, treo tháo công tơ)',
        ds: 4,
        is: ['Chi phí phát sinh — Khách hàng không hiểu ai chịu phí gì', 'Thay công tơ gây gián đoạn sinh hoạt/kinh doanh', 'ĐL tự ý thay đổi công suất mà không hỏi khách hàng trước', 'Không dọn dẹp sau thi công'],
      },
      {
        id: 't5',
        n: '4.5 Ký Hợp đồng sửa đổi bổ sung / Chấm dứt Hợp đồng',
        ds: 3,
        is: ['Khách hàng không hiểu nội dung pháp lý hợp đồng sửa đổi', 'Thay đổi chủ thể do thừa kế — giấy tờ phức tạp, nhân viên thiếu đồng cảm', 'Khách hàng không biết quy định chấm dứt hợp đồng khi không sử dụng quá 6 tháng'],
      },
      {
        id: 't6',
        n: '4.6 Hoàn tất, xác nhận với khách hàng',
        ds: 3,
        is: ['Không xác nhận lại rằng thay đổi đã hoàn tất', 'Không giải thích hóa đơn tháng sau thay đổi thế nào', 'Không hướng dẫn theo dõi trên app sau thay đổi'],
      },
    ],
  },
  {
    id: 'j5',
    l: 'Khiếu nại và Phản ánh',
    d: 'Tiếp nhận, xử lý, trả lời và theo dõi sau khiếu nại. Căn cứ: QT KN 6 bước, QĐ 2286, QT CSKH Đ10-11.',
    s: ALL.map((x) => x.id),
    tp: [
      {
        id: 't1',
        n: '5.1 Tiếp nhận khiếu nại (mọi hình thức)',
        ds: 5,
        is: ['Nhân viên ngắt lời khách hàng khi đang trình bày', 'Không ghi chép, không xác nhận lại vấn đề', 'Không cam kết thời gian phản hồi cụ thể', 'Thái độ phòng thủ, đổ lỗi', 'Khách hàng bị chuyển tiếp nhiều người, kể lại từ đầu'],
      },
      {
        id: 't2',
        n: '5.2 Xác minh, phân loại (chuẩn: 2 ngày)',
        ds: 4,
        is: ['Chuyển qua lại TTCSKH-CTĐL — Khách hàng bị đùn đẩy', 'Phân loại sai dịch vụ dẫn đến xử lý chậm', 'Khách hàng gọi hỏi — ĐTV lặp câu trả lời cũ', 'Khách hàng đặc biệt không được cử nhân viên liên hệ trực tiếp'],
      },
      {
        id: 't3',
        n: '5.3 Tra soát nội bộ (chuẩn: 5 ngày)',
        ds: 4,
        is: ['Khách hàng không được cập nhật tiến độ', 'Phải liên hệ nhiều lần, mỗi lần gặp nhân viên khác', 'Thời gian xử lý kéo dài quá cam kết', 'Đơn vị đóng phiếu nhưng chưa giải quyết'],
      },
      {
        id: 't4',
        n: '5.4 Trả lời khách hàng (chuẩn: 2 ngày sau tra soát)',
        ds: 4,
        is: ['Kết quả không thỏa đáng, không giải thích cơ sở', 'Nhân viên không thể hiện đồng cảm', 'Không đề xuất giải pháp bổ sung', 'Khách hàng khiếu nại lần 2+ nhưng không ai nâng cấp'],
      },
      {
        id: 't5',
        n: '5.5 Lưu trữ và giám sát nội bộ',
        ds: 3,
        is: ['Không ghi nhận bài học cải tiến', 'Không phân tích xu hướng khiếu nại lặp lại', 'Ban KD chưa rà soát phản ánh nhũng nhiễu'],
      },
      {
        id: 't6',
        n: '5.6 Theo dõi sau khiếu nại',
        ds: 3,
        is: ['Không gọi hỏi thăm khách hàng sau xử lý', 'Thiếu quy trình xử lý khủng hoảng khi khách hàng bức xúc, đăng lên mạng xã hội', 'Vấn đề tái diễn — Khách hàng phản ánh quá 3 lần'],
      },
    ],
  },
  {
    id: 'j6',
    l: 'Chuyển dịch năng lượng',
    d: 'ĐMTAM, trạm sạc xe điện, mua bán điện dư. Căn cứ: QT KD ĐMTMN Điều 1-6, Quy định dịch vụ điện Điều 9d.',
    s: ['sh2', 'sh6', 'nsh1', 'nsh2', 'nsh3', 'nsh6'],
    tp: [
      {
        id: 't1',
        n: '6.1 Khách hàng tìm hiểu thông tin ĐMTAM / xe điện',
        ds: 4,
        is: ['Nhân viên thiếu kiến thức chuyên môn', 'Chính sách giá mua điện dư thay đổi liên tục', 'Thông tin phân tán giữa nhiều kênh', 'Về xe điện: chưa có nhân viên nào được đào tạo'],
      },
      {
        id: 't2',
        n: '6.2 Nhân viên tư vấn phương án kỹ thuật',
        ds: 4,
        is: ['Không tư vấn được phương án tối ưu', 'Quy trình đấu nối phức tạp, thiếu tài liệu dễ hiểu', 'DN FDI cần tư vấn tiếng Anh — nhân viên không đáp ứng', 'Chi phí đấu nối không minh bạch'],
      },
      {
        id: 't3',
        n: '6.3 Nộp hồ sơ, thủ tục đấu nối',
        ds: 4,
        is: ['Thời gian xử lý chậm (khách hàng kỳ vọng 15 ngày, thực tế 35 ngày)', 'Yêu cầu kỹ thuật phức tạp Khách hàng không hiểu', 'Phải ký cam kết không tự ý tăng công suất — Khách hàng thắc mắc'],
      },
      {
        id: 't4',
        n: '6.4 Lắp đặt, kiểm tra, nghiệm thu',
        ds: 3,
        is: ['Phối hợp đơn vị bên thứ 3 chưa đồng bộ', 'Thời gian nghiệm thu kéo dài', 'Nhân viên kiểm tra thiếu chuyên nghiệp'],
      },
      {
        id: 't5',
        n: '6.5 Vận hành, thanh quyết toán điện dư',
        ds: 4,
        is: ['Thanh toán tiền điện dư chậm (khách hàng chờ 6 tháng)', 'Công tơ 2 chiều ghi sai do lỗi cài đặt', 'Không có kênh hỗ trợ riêng cho khách hàng ĐMTAM', 'Thay đổi chính sách giá không thông báo kịp thời'],
      },
      {
        id: 't6',
        n: '6.6 Thay đổi chủ thể / Chấm dứt Hợp đồng ĐMTMN',
        ds: 3,
        is: ['Quy trình thay đổi chủ thể phức tạp (Thỏa thuận 3 bên: Chủ đầu tư cũ, Chủ đầu tư mới, Bên mua điện)', 'Thừa kế — giấy tờ phức tạp, nhân viên thiếu kinh nghiệm', 'Chuyển địa điểm không duy trì hợp đồng cũ — Khách hàng không hiểu'],
      },
    ],
  },
];
export const NB = ['Lời nói thiếu tôn trọng, cộc lốc, khó nghe', 'Thái độ thờ ơ, không quan tâm vấn đề của khách hàng', 'Không giữ cam kết (hẹn không đến, hứa gọi lại không gọi)', 'Thiếu chuyên nghiệp (không đồng phục, không thẻ, làm việc riêng)', 'Đổ lỗi, từ chối trách nhiệm, đùn đẩy giữa các bộ phận'];
export const SN = [
  { id: 'sn1', t: 'Người cao tuổi (trên 70) sống một mình', f: ['Tỷ lệ ước tính (%)', 'Khó khăn chính khi tiếp cận dịch vụ điện', 'Giải pháp hỗ trợ hiện tại'] },
  { id: 'sn2', t: 'Người khuyết tật (vận động, thị giác, thính giác)', f: ['Tỷ lệ ước tính (%)', 'Khó khăn chính', 'Giải pháp hỗ trợ hiện tại'] },
  { id: 'sn3', t: 'Không sử dụng điện thoại thông minh, không biết chữ', f: ['Tỷ lệ ước tính (%)', 'Kênh liên lạc thay thế đang dùng', 'Khó khăn khi thanh toán'] },
  { id: 'sn4', t: 'Hộ dân vùng đặc biệt khó khăn', f: ['Số lượng hộ', 'Thời gian đến điểm giao dịch gần nhất', 'Cách nhân viên tiếp cận hiện tại'] },
  { id: 'sn5', t: 'Khách hàng quan trọng theo Thông tư 22/2020 (bệnh viện, trạm bơm, an ninh QP)', f: ['Số lượng khách hàng', 'Quy trình ưu tiên hiện tại', 'Cách thông báo ngừng CCĐ riêng'] },
];
export const EF = [
  { k: 'pv1', l: 'Số lượng khách hàng đã lắp đặt ĐMTAM', r: 1 },
  { k: 'pv2', l: 'Số lượng khách hàng đang tìm hiểu / đang trong quy trình', r: 1 },
  { k: 'pv3', l: 'Khó khăn chính khách hàng gặp khi làm thủ tục lắp ĐMTAM', r: 3 },
  { k: 'pv4', l: 'Năng lực tư vấn của NV về ĐMTAM, xe điện (Tốt/TB/Yếu)', r: 2 },
  { k: 'pv5', l: 'Vướng mắc về cơ chế mua bán điện dư, thanh quyết toán', r: 3 },
  { k: 'pv6', l: 'Nhu cầu trạm sạc xe điện tại địa bàn', r: 2 },
  { k: 'pv7', l: 'Đề xuất cải thiện dịch vụ cho khách hàng chuyển dịch năng lượng', r: 3 },
];
export const MF = [
  { k: 'm1', l: 'Đơn vị hiện có đo CSAT? Kết quả gần nhất?', r: 2 },
  { k: 'm2', l: 'Đơn vị có đo NPS? Kết quả?', r: 2 },
  { k: 'm3', l: 'Đơn vị có đo CES? Kết quả?', r: 2 },
  { k: 'm4', l: 'TG TB CTĐL tiếp nhận phiếu CRM (chuẩn: 10 phút)', r: 1 },
  { k: 'm5', l: 'Tỷ lệ liên hệ khách hàng trong 30 phút sau tiếp nhận phiếu', r: 1 },
  { k: 'm6', l: 'Tỷ lệ đóng phiếu đúng quy trình (có thỏa thuận khách hàng)', r: 1 },
  { k: 'm7', l: 'Số TH đóng phiếu khi chưa hoàn tất dịch vụ (6 tháng)', r: 1 },
];

export const DEFAULT_SURVEY_CONFIG = {
  themeBaseColor: '#003C8F',
  themeAccentColor: '#F7941D',
  orgName: 'Tập đoàn Điện lực Việt Nam',
  orgSubTitle: 'Tổng Công ty Điện lực miền Nam',
  title: 'Phiếu thu thập thông tin phục vụ xây dựng Bộ Chuẩn mực Hành vi TNKH',
  intro: 'Phiếu khảo sát được tổ chức theo 6 hành trình khách hàng với 42 điểm chạm. Vui lòng cung cấp theo thực tế vận hành.',
  groups: [
    { id: 'sh', name: 'Nhóm khách hàng sinh hoạt', items: SH },
    { id: 'nsh', name: 'Nhóm khách hàng ngoài sinh hoạt', items: NSH },
  ],
  journeys: JR,
  extra: {
    negativeBehaviors: NB,
    specialNeeds: SN,
    energyTransition: EF,
    metrics: MF,
  },
};

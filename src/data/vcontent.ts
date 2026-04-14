export type RoleKey =
  | 'admin'
  | 'pm'
  | 'specialist'
  | 'qc'
  | 'client'
  | 'client_director';

export type PageKey =
  | 'profile'
  | 'guide'
  | 'dashboard'
  | 'tracking'
  | 'notifications'
  | 'survey-admin'
  | 'client-orders'
  | 'client-new-order'
  | 'client-order-detail'
  | 'client-products'
  | 'client-delivery'
  | 'client-payment'
  | 'client-approvals'
  | 'producer-inbox'
  | 'order-pm-dashboard'
  | 'producer-launch'
  | 'producer-deliver'
  | 'producer-invoice'
  | 'production-workflow'
  | 'schedule-setup'
  | 'my-tasks'
  | 'smf01'
  | 'smf02'
  | 'smf03'
  | 'smf04'
  | 'smf05'
  | 'smf06'
  | 'smf07'
  | 'smf08'
  | 'vsmf01'
  | 'vsmf02'
  | 'vsmf03'
  | 'vsmf04'
  | 'vsmf05'
  | 'vsmf06'
  | 'vsmf07'
  | 'gsmf01'
  | 'gsmf02'
  | 'gsmf03'
  | 'gsmf04'
  | 'qc-criteria'
  | 'lecturer-question-bank'
  | 'users'
  | 'audit'
  | 'archived-products'
  | 'product-library';

export type NavItem = {
  key: PageKey;
  label: string;
  icon: string;
};

export type NavSection = {
  title: string;
  tone?: 'gold' | 'violet' | 'red' | 'cyan';
  items: NavItem[];
};

export const ROLE_META: Record<RoleKey, { label: string; title: string }> = {
  admin: { label: 'Admin', title: 'GĐ Đào tạo · Full access' },
  pm: { label: 'PM', title: 'Điều phối sản xuất' },
  specialist: { label: 'Specialist', title: 'Storyboard · Design · Voice · Edit' },
  qc: { label: 'QC', title: 'Kiểm soát chất lượng' },
  client: { label: 'Client', title: 'Cổng khách hàng' },
  client_director: { label: 'Client Director', title: 'Duyệt đơn nội bộ khách hàng' },
};

export const PAGE_LABELS = {
  profile: 'Ho so ca nhan',
  guide: 'Cẩm nang HDSD phần mềm',
  dashboard: 'Quản lý đơn hàng',
  tracking: 'Kế hoạch sản xuất',
  notifications: 'Thông báo',
  'survey-admin': 'Quản lý Khảo sát',
  'client-orders': 'Đơn hàng của tôi',
  'client-new-order': 'Tạo đơn hàng mới',
  'client-order-detail': 'Chi tiết đơn hàng',
  'client-products': 'Nhập yêu cầu sản phẩm',
  'client-delivery': 'Nghiệm thu',
  'client-payment': 'Thanh toán',
  'client-approvals': 'Duyệt đơn khách hàng',
  'producer-inbox': 'Hộp thư đơn hàng',
  'order-pm-dashboard': 'Bảng điều khiển PM theo đơn',
  'producer-launch': 'Chuyển vào sản xuất',
  'producer-deliver': 'Bàn giao sản phẩm',
  'producer-invoice': 'Đề nghị thanh toán',
  'production-workflow': 'Luồng sản xuất',
  'schedule-setup': 'Thiết lập kế hoạch',
  'my-tasks': 'Công việc của tôi',
  smf01: 'SMF-01 QL Đầu vào',
  smf02: 'SMF-02 QL Storyboard',
  smf03: 'SMF-03 QL Thiết kế Slides',
  smf04: 'SMF-04 QL QC Slides',
  smf05: 'SMF-05 QL Thu Voice',
  smf06: 'SMF-06 QL Biên tập Video',
  smf07: 'SMF-07 QL QC Video',
  smf08: 'SMF-08 QL SCORM + Quiz',
  vsmf01: 'VSMF-01 QL Đầu vào',
  vsmf02: 'VSMF-02 QL Storyboard',
  vsmf03: 'VSMF-03 QL Thiết kế Slides',
  vsmf04: 'VSMF-04 QC Slides',
  vsmf05: 'VSMF-05 Thu voice',
  vsmf06: 'VSMF-06 Biên tập Video',
  vsmf07: 'VSMF-07 QC Video',
  gsmf01: 'GSMF-01 Yêu cầu khởi tạo',
  gsmf02: 'GSMF-02 Màn chạy thử game',
  gsmf03: 'GSMF-03 QC game',
  gsmf04: 'GSMF-04 Game hoàn chỉnh',
  'qc-criteria': 'Tiêu chí QC',
  users: 'Người dùng',
  audit: 'Nhật ký kiểm tra',
  'archived-products': 'Sản phẩm lưu trữ',
  'product-library': 'Thư viện lưu trữ',
} as Record<PageKey, string>;

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Tổng quan',
    items: [
      { key: 'dashboard', label: 'Quản lý đơn hàng', icon: '⬛' },
      { key: 'tracking', label: 'Kế hoạch sản xuất', icon: '📊' },
      { key: 'survey-admin', label: 'Quản lý Khảo sát', icon: '📋' },
      { key: 'product-library', label: 'Thư viện lưu trữ', icon: '📚' },
    ],
  },
  {
    title: 'Quản lý đơn hàng - Client',
    tone: 'gold',
    items: [
      { key: 'client-orders', label: 'Khách hàng — Đơn hàng của tôi', icon: '🏢' },
      { key: 'client-order-detail', label: 'Chi tiết Đơn hàng', icon: '🔍' },
      { key: 'client-new-order', label: 'Tạo Đơn hàng mới', icon: '➕' },
      { key: 'client-products', label: 'Nhập YC từng Sản phẩm', icon: '📦' },
      { key: 'client-delivery', label: 'Nghiệm thu Sản phẩm', icon: '✅' },
      { key: 'client-payment', label: 'Thanh toán', icon: '💳' },
      { key: 'client-approvals', label: 'Duyệt đơn khách hàng', icon: '👔' },
    ],
  },
  {
    title: 'Quản lý đơn hàng - PM',
    tone: 'gold',
    items: [
      { key: 'producer-inbox', label: 'Producer — Hộp thư đơn hàng', icon: '📥' },
      { key: 'order-pm-dashboard', label: 'Bảng điều khiển PM theo đơn', icon: '🗂' },
      { key: 'producer-launch', label: 'Chuyển vào Sản xuất', icon: '🚀' },
      { key: 'producer-deliver', label: 'Bàn giao Sản phẩm', icon: '📤' },
      { key: 'producer-invoice', label: 'Đề nghị Thanh toán', icon: '💰' },
    ],
  },
  {
    title: 'Kế hoạch SX',
    items: [
      { key: 'production-workflow', label: 'Luồng sản xuất', icon: '🎯' },
      { key: 'schedule-setup', label: 'Thiết lập Kế hoạch', icon: '📐' },
      { key: 'my-tasks', label: 'Công việc của tôi', icon: '✅' },
    ],
  },
  {
    title: 'Module 2 — E-learning SMF',
    tone: 'violet',
    items: [
      { key: 'smf01', label: 'SMF-01 QL Đầu vào', icon: '📥' },
      { key: 'smf02', label: 'SMF-02 QL Storyboard', icon: '📜' },
      { key: 'smf03', label: 'SMF-03 QL Thiết kế Slides', icon: '🎨' },
      { key: 'smf04', label: 'SMF-04 QL QC Slides', icon: '⛔' },
      { key: 'smf05', label: 'SMF-05 QL Thu Voice', icon: '🎙' },
      { key: 'smf06', label: 'SMF-06 QL Biên tập Video', icon: '🎬' },
      { key: 'smf07', label: 'SMF-07 QL QC Video', icon: '🧪' },
      { key: 'smf08', label: 'SMF-08 QL SCORM + Quiz', icon: '📦' },
    ],
  },
  {
    title: 'Module 3 — Video học liệu',
    tone: 'red',
    items: [
      { key: 'vsmf01', label: 'VSMF-01 QL Đầu vào', icon: '📥' },
      { key: 'vsmf02', label: 'VSMF-02 QL Storyboard', icon: '📜' },
      { key: 'vsmf03', label: 'VSMF-03 QL Thiết kế Slides', icon: '🎨' },
      { key: 'vsmf04', label: 'VSMF-04 QC Slides', icon: '🧪' },
      { key: 'vsmf05', label: 'VSMF-05 Thu voice', icon: '🎙' },
      { key: 'vsmf06', label: 'VSMF-06 Biên tập Video', icon: '🎬' },
      { key: 'vsmf07', label: 'VSMF-07 QC Video', icon: '✅' },
    ],
  },
  {
    title: 'Module 4 — Gamification',
    tone: 'cyan',
    items: [
      { key: 'gsmf01', label: 'GSMF-01 Yêu cầu khởi tạo', icon: '🎮' },
      { key: 'gsmf02', label: 'GSMF-02 Màn chạy thử game', icon: '🕹' },
      { key: 'gsmf03', label: 'GSMF-03 QC game', icon: '🧪' },
      { key: 'gsmf04', label: 'GSMF-04 Game hoàn chỉnh', icon: '🏁' },
    ],
  },
  {
    title: 'Hệ thống',
    tone: 'cyan',
    items: [
      { key: 'qc-criteria', label: 'Tiêu chí QC', icon: '📏' },
      { key: 'archived-products', label: 'Sản phẩm lưu trữ', icon: '🗃' },
      { key: 'users', label: 'Người dùng', icon: '👥' },
      { key: 'audit', label: 'Nhật ký kiểm tra', icon: '📚' },
    ],
  },
  {
    title: 'Hỗ trợ',
    tone: 'cyan',
    items: [{ key: 'guide', label: 'Cẩm nang HDSD phần mềm', icon: '📘' }],
  },
];

export const ALLOWED_PAGES: Record<RoleKey, PageKey[]> = {
  admin: Object.keys(PAGE_LABELS) as PageKey[],
  pm: ['profile', 'guide', 'dashboard', 'tracking', 'survey-admin', 'notifications', 'producer-inbox', 'order-pm-dashboard', 'producer-launch', 'producer-deliver', 'producer-invoice', 'production-workflow', 'schedule-setup', 'my-tasks', 'smf01', 'smf02', 'vsmf01', 'vsmf02', 'gsmf01', 'gsmf02', 'archived-products', 'product-library'],
  specialist: ['profile', 'guide', 'notifications', 'my-tasks', 'smf02', 'smf03', 'smf05', 'smf06', 'smf08', 'vsmf02', 'vsmf03', 'vsmf05', 'vsmf06', 'gsmf02', 'gsmf04', 'product-library'],
  qc: ['profile', 'guide', 'notifications', 'my-tasks', 'smf04', 'smf07', 'vsmf04', 'vsmf07', 'gsmf03', 'qc-criteria', 'tracking', 'product-library'],
  client: ['profile', 'guide', 'client-orders', 'client-order-detail', 'client-new-order', 'client-products', 'client-delivery', 'client-payment', 'notifications'],
  client_director: ['profile', 'guide', 'client-orders', 'client-order-detail', 'client-new-order', 'client-products', 'client-delivery', 'client-payment', 'client-approvals', 'notifications'],
};

PAGE_LABELS['lecturer-question-bank'] = 'Bộ câu hỏi giảng viên';

const systemSection = NAV_SECTIONS.find((section) => section.items.some((item) => item.key === 'qc-criteria'));
if (systemSection && !systemSection.items.some((item) => item.key === 'lecturer-question-bank')) {
  const qcCriteriaIndex = systemSection.items.findIndex((item) => item.key === 'qc-criteria');
  systemSection.items.splice(qcCriteriaIndex >= 0 ? qcCriteriaIndex + 1 : 0, 0, {
    key: 'lecturer-question-bank',
    label: 'Bộ câu hỏi giảng viên',
    icon: 'LQ',
  });
}

if (!ALLOWED_PAGES.qc.includes('lecturer-question-bank')) {
  ALLOWED_PAGES.qc.splice(ALLOWED_PAGES.qc.indexOf('qc-criteria') + 1, 0, 'lecturer-question-bank');
}

if (!ALLOWED_PAGES.admin.includes('lecturer-question-bank')) {
  ALLOWED_PAGES.admin.push('lecturer-question-bank');
}

export const KPIS = [
  { label: 'Task quá hạn', value: '6', sub: 'Cần xử lý ngay', tone: 'danger' },
  { label: 'Sản phẩm đang SX', value: '24', sub: '↑3 tuần này', tone: 'violet' },
  { label: 'Hoàn thành tháng', value: '11', sub: 'Target: 15', tone: 'success' },
  { label: 'Đơn hàng active', value: '8', sub: '5 đối tác', tone: 'warning' },
] as const;

export const HEATMAP_ROWS = [
  { order: 'VNPT-BG001', stages: ['done', 'done', 'done', 'done', 'active', 'idle', 'idle', 'idle', 'idle'] },
  { order: 'EVN-Video01', stages: ['done', 'done', 'done', 'done', 'done', 'done', 'fail', 'locked', 'locked'] },
  { order: 'PLX-Game01', stages: ['done', 'done', 'done', 'active', 'locked', 'locked', 'locked', 'idle', 'idle'] },
];

export const ALERTS = [
  { level: 'critical', title: 'VNPT BG-001 B5: Voice hạn 13/4', detail: 'VC: Minh Tú · 7/14 scenes', action: 'smf05' as PageKey },
  { level: 'critical', title: 'EVN-Video01 B7: QC FAIL R2', detail: '3 lỗi Major chờ sửa', action: 'vsmf06' as PageKey },
  { level: 'warning', title: 'SGT đơn mới: Inbox chờ PM nhận', detail: 'Gửi 5 ngày trước', action: 'producer-inbox' as PageKey },
  { level: 'warning', title: 'VNPT đơn mới chờ bàn giao đợt 1', detail: '3 sản phẩm đã hoàn thành', action: 'producer-deliver' as PageKey },
];

export const ORDERS = [
  { id: 'ORD-2606', title: 'VNPT Rising Batch 3', client: 'VNPT Corp', module: 'ELN', status: 'in_production', deadline: '2026-04-18', stage: 'SMF-05', owner: 'Văn Đức', progress: 68, products: 3 },
  { id: 'ORD-2607', title: 'EVN Safety Video 01', client: 'EVN', module: 'VIDEO', status: 'qc_fail', deadline: '2026-04-15', stage: 'VSMF-07', owner: 'Hà Nhi', progress: 82, products: 1 },
  { id: 'ORD-2608', title: 'SaigonTourist Service Culture', client: 'SaigonTourist', module: 'ELN', status: 'pending_launch', deadline: '2026-04-25', stage: 'SMF-01', owner: 'Lê Hải', progress: 12, products: 2 },
  { id: 'ORD-2609', title: 'BIDV KYC Storyline', client: 'BIDV', module: 'ELN', status: 'ready_delivery', deadline: '2026-04-12', stage: 'SMF-08', owner: 'Phương Anh', progress: 96, products: 1 },
];

export const TASKS = [
  { id: 'TS-401', title: 'Review storyboard v2', owner: 'PM', due: 'Hôm nay 15:00', status: 'review', stage: 'SMF-02' },
  { id: 'TS-402', title: 'Sync subtitle và render 1080p', owner: 'Specialist', due: 'Hôm nay 18:00', status: 'in_progress', stage: 'VSMF-06' },
  { id: 'TS-403', title: 'QC video batch 3', owner: 'QC', due: 'Ngày mai', status: 'todo', stage: 'SMF-07' },
  { id: 'TS-404', title: 'Khóa input bundle', owner: 'PM', due: 'Quá hạn 1 ngày', status: 'overdue', stage: 'SMF-01' },
];

export const NOTIFICATIONS = [
  { level: 'critical', title: 'QC fail ở EVN-Video01', body: 'VSMF-07 trả về 3 lỗi Major, cần mở lại VSMF-06.', when: '11/4 09:15', page: 'vsmf06' as PageKey },
  { level: 'warning', title: 'Đơn hàng ORD-2608 chờ launch', body: 'Input bundle đã đủ, PM cần xác nhận intake.', when: '11/4 08:40', page: 'producer-launch' as PageKey },
  { level: 'info', title: 'Client xác nhận thanh toán đợt 1', body: 'VNPT BG-002 đã xác nhận receipt trên cổng client.', when: '10/4 16:30', page: 'client-payment' as PageKey },
];

export const USERS = [
  { name: 'Lê Hải', email: 'le.hai@peopleone.vn', role: 'Admin', org: 'PeopleOne', active: true },
  { name: 'Nguyễn Văn Đức', email: 'v.duc@peopleone.vn', role: 'PM', org: 'PeopleOne', active: true },
  { name: 'Phương Anh', email: 'p.anh@peopleone.vn', role: 'Specialist', org: 'PeopleOne', active: true },
  { name: 'Minh Tú', email: 'm.tu@peopleone.vn', role: 'Specialist', org: 'PeopleOne', active: true },
  { name: 'Hà Nhi', email: 'ha.nhi@peopleone.vn', role: 'QC', org: 'PeopleOne', active: true },
  { name: 'Nguyễn Thị Lan', email: 'n.lan@vnpt.vn', role: 'Client', org: 'VNPT Corp', active: true },
];

export const QC_CRITERIA = [
  { group: 'B4 Slides', name: 'Font đúng Brand Spec', severity: 'Critical', stage: 'B4' },
  { group: 'B4 Slides', name: 'Màu palette đúng', severity: 'Critical', stage: 'B4' },
  { group: 'B4 Slides', name: 'Alignment nhất quán', severity: 'Major', stage: 'B4' },
  { group: 'B7 Video', name: 'Sync audio-video', severity: 'Critical', stage: 'B7' },
  { group: 'B7 Video', name: 'BGM balance (voice > BGM)', severity: 'Major', stage: 'B7' },
];

export const AUDIT_LOGS = [
  { time: '11/4 09:15', actor: 'Hà Nhi', action: 'QC_FAIL', object: 'EVN VI-001', detail: 'QC Fail B7 R2 · 3 Major lỗi' },
  { time: '11/4 08:40', actor: 'Văn Đức', action: 'ORDER_ACCEPTED', object: 'ORD-2606', detail: 'VNPT Rising Batch 3 nhận đơn' },
  { time: '10/4 16:30', actor: 'Phương Anh', action: 'SB_SUBMITTED', object: 'SGT-001 SB v2', detail: 'Storyboard v2 trình duyệt PM' },
  { time: '10/4 14:00', actor: 'Nguyễn Lan', action: 'DELIVERY_ACCEPTED', object: 'VNPT BG-002', detail: 'Nghiệm thu đạt · OTP confirmed' },
];

export const STAGE_PAGES: Record<
  string,
  {
    eye: string;
    title: string;
    subtitle: string;
    columns: { title: string; count: number; tone: 'neutral' | 'danger' | 'warning' | 'success' }[];
    queue: { product: string; note: string; owner: string; status: string }[];
  }
> = {
  smf01: {
    eye: 'Module 2 · SMF-01',
    title: 'Quản lý Đầu vào',
    subtitle: 'Gate đầu vào trước khi PM nhận đơn và launch sản xuất.',
    columns: [
      { title: 'Cần bổ sung', count: 3, tone: 'danger' },
      { title: 'Chờ xác nhận', count: 8, tone: 'warning' },
      { title: 'Sẵn sàng launch', count: 5, tone: 'success' },
    ],
    queue: [
      { product: 'VNPT-BG001 / P01', note: 'Thiếu typography và palette final', owner: 'Client', status: 'changes_requested' },
      { product: 'SGT-001 / P02', note: 'Đủ hồ sơ, chờ PM confirm', owner: 'PM', status: 'submitted' },
    ],
  },
  smf02: {
    eye: 'Module 2 · SMF-02',
    title: 'Quản lý Storyboard',
    subtitle: 'Không gian tác nghiệp B2: soạn draft, submit, PM review và mở B3.',
    columns: [
      { title: 'Cần làm', count: 4, tone: 'danger' },
      { title: 'Đang viết', count: 6, tone: 'warning' },
      { title: 'Chờ duyệt PM', count: 3, tone: 'neutral' },
      { title: 'Đã duyệt', count: 9, tone: 'success' },
    ],
    queue: [
      { product: 'VNPT-BG001 / P02', note: 'Storyboard v3 đang chờ PM comment', owner: 'Phương Anh', status: 'in_review' },
      { product: 'BIDV-KYC / P01', note: 'Đã approve, chuẩn bị mở B3', owner: 'PM', status: 'approved' },
    ],
  },
  smf03: {
    eye: 'Module 2 · SMF-03',
    title: 'Quản lý Thiết kế Slides',
    subtitle: 'Theo dõi tiến độ thiết kế, kiểm soát checklist brand và chuẩn bị handoff sang QC.',
    columns: [
      { title: 'Cần làm', count: 5, tone: 'danger' },
      { title: 'Đang thiết kế', count: 7, tone: 'warning' },
      { title: 'Chờ submit B4', count: 2, tone: 'neutral' },
      { title: 'Pass B4', count: 10, tone: 'success' },
    ],
    queue: [
      { product: 'VNPT-BG001 / P03', note: 'Key visual v2 đã ổn, chờ finalize scene 7-12', owner: 'Design', status: 'in_progress' },
      { product: 'SGT-001 / P01', note: 'Slides pass brand check', owner: 'QC', status: 'approved' },
    ],
  },
  smf04: {
    eye: 'Module 2 · SMF-04',
    title: 'Quản lý QC Slides',
    subtitle: 'QC gate cho slides: claim review, pass/fail và trả về B3 khi cần.',
    columns: [
      { title: 'Queue cần làm', count: 3, tone: 'danger' },
      { title: 'Đang review', count: 2, tone: 'warning' },
      { title: 'Đã pass', count: 11, tone: 'success' },
    ],
    queue: [{ product: 'EVN-Safety / P01', note: '2 Major: spacing và footnote chưa đúng template', owner: 'Hà Nhi', status: 'review' }],
  },
  smf05: {
    eye: 'Module 2 · SMF-05',
    title: 'Quản lý Thu voice',
    subtitle: 'Theo dõi recording progress, review audio và chuẩn bị bàn giao sang dựng.',
    columns: [
      { title: 'Cần thu', count: 4, tone: 'danger' },
      { title: 'Đang thu', count: 5, tone: 'warning' },
      { title: 'Review PM', count: 2, tone: 'neutral' },
      { title: 'Sẵn sàng B6', count: 8, tone: 'success' },
    ],
    queue: [{ product: 'VNPT-BG001 / P01', note: '7/14 scenes đã thu, thiếu accent correction', owner: 'Minh Tú', status: 'overdue' }],
  },
  smf06: {
    eye: 'Module 2 · SMF-06',
    title: 'Quản lý Biên tập Video',
    subtitle: 'Theo dõi dựng, subtitle, render preset và checklist handoff sang QC video.',
    columns: [
      { title: 'Cần dựng', count: 3, tone: 'danger' },
      { title: 'Đang dựng', count: 6, tone: 'warning' },
      { title: 'Chờ QC B7', count: 3, tone: 'neutral' },
      { title: 'B7 Pass', count: 6, tone: 'success' },
    ],
    queue: [{ product: 'EVN-Video01 / P01', note: 'QC fail R2, đang fix subtitle frame và sync', owner: 'Video Team', status: 'changes_requested' }],
  },
  smf07: {
    eye: 'Module 2 · SMF-07',
    title: 'Quản lý QC Video',
    subtitle: 'Bảng review B7, nơi QC quyết định pass/fail và mở bàn giao tiếp theo.',
    columns: [
      { title: 'Queue review', count: 2, tone: 'danger' },
      { title: 'Đang review', count: 3, tone: 'warning' },
      { title: 'Pass', count: 7, tone: 'success' },
    ],
    queue: [{ product: 'EVN-Video01 / P01', note: '3 lỗi Major: subtitle overflow, intro outro, sync VO', owner: 'Hà Nhi', status: 'fail' }],
  },
  smf08: {
    eye: 'Module 2 · SMF-08',
    title: 'Quản lý SCORM + Quiz',
    subtitle: 'Đóng gói SCORM, cấu hình quiz và test LMS trước khi bàn giao.',
    columns: [
      { title: 'Cần đóng gói', count: 2, tone: 'danger' },
      { title: 'Đang test LMS', count: 2, tone: 'warning' },
      { title: 'Sẵn sàng BG', count: 5, tone: 'success' },
    ],
    queue: [{ product: 'BIDV-KYC / P01', note: 'Quiz balance check đạt, chờ upload package final', owner: 'CD', status: 'packaging' }],
  },
  gsmf01: {
    eye: 'Module 4 · GSMF-01',
    title: 'Yêu cầu khởi tạo',
    subtitle: 'Khóa gameplay brief, learning scope, asset scope và điều kiện mở sprint prototype.',
    columns: [
      { title: 'Thiếu brief', count: 2, tone: 'danger' },
      { title: 'Chờ chốt scope', count: 3, tone: 'warning' },
      { title: 'Sẵn sàng prototype', count: 2, tone: 'success' },
    ],
    queue: [
      { product: 'PLX-Game01 / Sprint A', note: 'Thiếu scoring rubric và approver contact', owner: 'Client', status: 'changes_requested' },
      { product: 'VNPT-QuizRush / P01', note: 'Gameplay brief đã đủ, PM chờ xác nhận', owner: 'PM', status: 'submitted' },
    ],
  },
  gsmf02: {
    eye: 'Module 4 · GSMF-02',
    title: 'Màn chạy thử game',
    subtitle: 'Theo dõi bản playable, logic core loop, balancing và feedback vòng thử nghiệm.',
    columns: [
      { title: 'Cần dựng prototype', count: 2, tone: 'danger' },
      { title: 'Đang chạy thử', count: 4, tone: 'warning' },
      { title: 'Chờ QC game', count: 1, tone: 'neutral' },
      { title: 'Pass internal playtest', count: 3, tone: 'success' },
    ],
    queue: [
      { product: 'PLX-Game01 / Build 0.8', note: 'Core loop ổn, cần chỉnh reward pacing và retry flow', owner: 'Game Team', status: 'in_progress' },
      { product: 'VNPT-QuizRush / Build 1.0', note: 'Playtest nội bộ đạt, chờ QA smoke', owner: 'PM', status: 'approved' },
    ],
  },
  gsmf03: {
    eye: 'Module 4 · GSMF-03',
    title: 'QC game',
    subtitle: 'Kiểm tra bug blocker, balancing, tracking score và điều kiện pass trước khi phát hành.',
    columns: [
      { title: 'Queue QC', count: 2, tone: 'danger' },
      { title: 'Đang test', count: 2, tone: 'warning' },
      { title: 'Pass QA', count: 4, tone: 'success' },
    ],
    queue: [
      { product: 'PLX-Game01 / Build 0.8', note: '1 blocker ở retry state và 2 major ở score reset', owner: 'QC', status: 'fail' },
    ],
  },
  gsmf04: {
    eye: 'Module 4 · GSMF-04',
    title: 'Game hoàn chỉnh',
    subtitle: 'Khóa build release, asset cuối, handoff package và checklist sẵn sàng bàn giao.',
    columns: [
      { title: 'Cần hoàn thiện', count: 1, tone: 'danger' },
      { title: 'Đang đóng gói', count: 2, tone: 'warning' },
      { title: 'Sẵn sàng bàn giao', count: 3, tone: 'success' },
    ],
    queue: [
      { product: 'VNPT-QuizRush / Release Candidate', note: 'Final build đã pass QC, chờ export package và note handoff', owner: 'Game Team', status: 'packaging' },
    ],
  },
};

export const VIDEO_STAGE_MAP: Record<string, keyof typeof STAGE_PAGES> = {
  vsmf01: 'smf01',
  vsmf02: 'smf02',
  vsmf03: 'smf03',
  vsmf04: 'smf04',
  vsmf05: 'smf05',
  vsmf06: 'smf06',
  vsmf07: 'smf07',
};

export const GAME_STAGE_MAP: Record<string, keyof typeof STAGE_PAGES> = {
  gsmf01: 'gsmf01',
  gsmf02: 'gsmf02',
  gsmf03: 'gsmf03',
  gsmf04: 'gsmf04',
};

export function getAllowedPages(role: RoleKey) {
  return ALLOWED_PAGES[role];
}

export function isWorkflowStage(page: string) {
  return /^smf0[1-8]$|^vsmf0[1-7]$|^gsmf0[1-4]$/.test(page);
}

export function normalizeAppRole(role: string | null | undefined): RoleKey {
  if (role === 'cd' || role === 'vc' || role === 'designer') return 'specialist';
  if (role === 'client_director') return 'client_director';
  if (role === 'admin' || role === 'pm' || role === 'specialist' || role === 'qc' || role === 'client') {
    return role;
  }
  return 'client';
}

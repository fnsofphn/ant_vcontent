import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Card, Kpi, SectionHeader } from '@/components/ui/Primitives';
import {
  inferProductWorkflowModule,
  listOrdersWithProducts,
  updateOrder,
  type OrderRow,
  type ProductRow,
} from '@/services/vcontent';

type ModuleCode = 'ELN' | 'VIDEO' | 'GAME';
type GanttMode = 'day' | 'week';
type PlanningStrategy = 'backward' | 'resource_optimized' | 'fastest_delivery';

type StagePlanCell = {
  stageCode: string;
  startDate: string;
  dueDate: string;
  owner: string;
};

type ProductPlanRow = {
  productId: string;
  productName: string;
  module: ModuleCode;
  stages: Record<string, StagePlanCell>;
};

type TeamCapacity = {
  pm: number;
  storyboard: number;
  design: number;
  qc: number;
  voice: number;
  video: number;
  scorm: number;
  game: number;
};

type PlanningPayload = {
  version: 1;
  strategy: PlanningStrategy;
  baselineStartDate: string;
  generatedAt: string;
  teamCapacity: TeamCapacity;
  bottlenecks: string;
  products: Record<string, ProductPlanRow>;
};

type WorkflowStage = {
  code: string;
  label: string;
  slaDays: number;
  roleKey: keyof TeamCapacity;
};

type PortfolioRow = {
  order: OrderRow;
  productCount: number;
  moduleCounts: Record<ModuleCode, number>;
  workloadDays: number;
  stageBreakdown: Record<string, number>;
};

const DEFAULT_CAPACITY: TeamCapacity = {
  pm: 1,
  storyboard: 2,
  design: 2,
  qc: 1,
  voice: 1,
  video: 2,
  scorm: 1,
  game: 1,
};

const WORKFLOW_BY_MODULE: Record<ModuleCode, WorkflowStage[]> = {
  ELN: [
    { code: 'SMF-01', label: 'SMF-01 Dau vao', slaDays: 1, roleKey: 'pm' },
    { code: 'SMF-02', label: 'SMF-02 Storyboard', slaDays: 3, roleKey: 'storyboard' },
    { code: 'SMF-03', label: 'SMF-03 Thiet ke Slides', slaDays: 5, roleKey: 'design' },
    { code: 'SMF-04', label: 'SMF-04 QC Slides', slaDays: 1, roleKey: 'qc' },
    { code: 'SMF-05', label: 'SMF-05 Thu Voice', slaDays: 3, roleKey: 'voice' },
    { code: 'SMF-06', label: 'SMF-06 Bien tap Video', slaDays: 5, roleKey: 'video' },
    { code: 'SMF-07', label: 'SMF-07 QC Video', slaDays: 1, roleKey: 'qc' },
    { code: 'SMF-08', label: 'SMF-08 SCORM + Quiz', slaDays: 3, roleKey: 'scorm' },
  ],
  VIDEO: [
    { code: 'VSMF-01', label: 'VSMF-01 Dau vao', slaDays: 1, roleKey: 'pm' },
    { code: 'VSMF-02', label: 'VSMF-02 Storyboard', slaDays: 3, roleKey: 'storyboard' },
    { code: 'VSMF-03', label: 'VSMF-03 Thiet ke Slides', slaDays: 5, roleKey: 'design' },
    { code: 'VSMF-04', label: 'VSMF-04 QC Slides', slaDays: 1, roleKey: 'qc' },
    { code: 'VSMF-05', label: 'VSMF-05 Thu Voice', slaDays: 3, roleKey: 'voice' },
    { code: 'VSMF-06', label: 'VSMF-06 Bien tap Video', slaDays: 5, roleKey: 'video' },
    { code: 'VSMF-07', label: 'VSMF-07 QC Video', slaDays: 1, roleKey: 'qc' },
  ],
  GAME: [
    { code: 'GSMF-01', label: 'GSMF-01 Khoi tao', slaDays: 2, roleKey: 'pm' },
    { code: 'GSMF-02', label: 'GSMF-02 Prototype', slaDays: 5, roleKey: 'game' },
    { code: 'GSMF-03', label: 'GSMF-03 QC Game', slaDays: 2, roleKey: 'qc' },
    { code: 'GSMF-04', label: 'GSMF-04 Ban hoan chinh', slaDays: 3, roleKey: 'game' },
  ],
};

const STAGE_BREAKDOWN_COLUMNS = ['01', '02', '03', '04', '05', '06', '07', '08'];

function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function addDays(dateString: string, days: number) {
  const base = new Date(`${dateString}T00:00:00`);
  base.setDate(base.getDate() + days);
  return toIsoDate(base);
}

function subtractDays(dateString: string, days: number) {
  return addDays(dateString, -days);
}

function diffDays(start: string, end: string) {
  if (!start || !end) return 0;
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
}

function eachDateInclusive(startDate: string, dueDate: string) {
  const total = Math.max(diffDays(startDate, dueDate), 0);
  return Array.from({ length: total + 1 }, (_value, index) => addDays(startDate, index));
}

function startOfWeek(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return toIsoDate(date);
}

function getRoleLabel(roleKey: keyof TeamCapacity) {
  return {
    pm: 'PM',
    storyboard: 'Storyboard',
    design: 'Design',
    qc: 'QC',
    voice: 'Voice',
    video: 'Video',
    scorm: 'SCORM',
    game: 'Game',
  }[roleKey];
}

function getStrategyLabel(strategy: PlanningStrategy) {
  return {
    backward: 'Backward planning',
    resource_optimized: 'Resource optimized',
    fastest_delivery: 'Fastest delivery',
  }[strategy];
}

function getStrategyDescription(strategy: PlanningStrategy) {
  return {
    backward: 'Tinh timeline lui tu deadline client, phu hop de khoi tao ke hoach chuan.',
    resource_optimized: 'Tinh lui tu deadline va han che qua tai theo nang luc role/team.',
    fastest_delivery: 'Day san xuat som nhat tu ngay baseline de ra timeline nhanh nhat.',
  }[strategy];
}

function moduleTone(module: ModuleCode): 'violet' | 'danger' | 'success' {
  if (module === 'ELN') return 'violet';
  if (module === 'VIDEO') return 'danger';
  return 'success';
}

function normalizeModule(product: ProductRow, order: OrderRow): ModuleCode {
  return inferProductWorkflowModule(product.id, order.module) as ModuleCode;
}

function createEmptyRoleUsage() {
  return {
    pm: new Map<string, number>(),
    storyboard: new Map<string, number>(),
    design: new Map<string, number>(),
    qc: new Map<string, number>(),
    voice: new Map<string, number>(),
    video: new Map<string, number>(),
    scorm: new Map<string, number>(),
    game: new Map<string, number>(),
  } as Record<keyof TeamCapacity, Map<string, number>>;
}

function reserveRoleWindow(
  roleUsage: Record<keyof TeamCapacity, Map<string, number>>,
  roleKey: keyof TeamCapacity,
  startDate: string,
  dueDate: string,
) {
  eachDateInclusive(startDate, dueDate).forEach((date) => {
    const bucket = roleUsage[roleKey];
    bucket.set(date, (bucket.get(date) || 0) + 1);
  });
}

function hasRoleWindowCapacity(
  roleUsage: Record<keyof TeamCapacity, Map<string, number>>,
  roleKey: keyof TeamCapacity,
  startDate: string,
  dueDate: string,
  capacity: number,
) {
  const effectiveCapacity = Math.max(capacity, 1);
  return eachDateInclusive(startDate, dueDate).every((date) => (roleUsage[roleKey].get(date) || 0) < effectiveCapacity);
}

function findLatestCapacityWindow(
  latestDueDate: string,
  stage: WorkflowStage,
  teamCapacity: TeamCapacity,
  roleUsage: Record<keyof TeamCapacity, Map<string, number>>,
) {
  let candidateDueDate = latestDueDate;
  for (let attempts = 0; attempts < 540; attempts += 1) {
    const candidateStartDate = subtractDays(candidateDueDate, Math.max(stage.slaDays - 1, 0));
    if (hasRoleWindowCapacity(roleUsage, stage.roleKey, candidateStartDate, candidateDueDate, teamCapacity[stage.roleKey])) {
      return { startDate: candidateStartDate, dueDate: candidateDueDate };
    }
    candidateDueDate = subtractDays(candidateDueDate, 1);
  }

  return {
    startDate: subtractDays(latestDueDate, Math.max(stage.slaDays - 1, 0)),
    dueDate: latestDueDate,
  };
}

function findEarliestCapacityWindow(
  earliestStartDate: string,
  stage: WorkflowStage,
  teamCapacity: TeamCapacity,
  roleUsage: Record<keyof TeamCapacity, Map<string, number>>,
) {
  let candidateStartDate = earliestStartDate;
  for (let attempts = 0; attempts < 540; attempts += 1) {
    const candidateDueDate = addDays(candidateStartDate, Math.max(stage.slaDays - 1, 0));
    if (hasRoleWindowCapacity(roleUsage, stage.roleKey, candidateStartDate, candidateDueDate, teamCapacity[stage.roleKey])) {
      return { startDate: candidateStartDate, dueDate: candidateDueDate };
    }
    candidateStartDate = addDays(candidateStartDate, 1);
  }

  return {
    startDate: earliestStartDate,
    dueDate: addDays(earliestStartDate, Math.max(stage.slaDays - 1, 0)),
  };
}

function planProductBackward(
  product: ProductRow,
  module: ModuleCode,
  deadline: string,
  strategy: PlanningStrategy,
  teamCapacity: TeamCapacity,
  roleUsage: Record<keyof TeamCapacity, Map<string, number>>,
): ProductPlanRow {
  const stages = WORKFLOW_BY_MODULE[module];
  const stageMap: Record<string, StagePlanCell> = {};
  let cursorDueDate = deadline;

  [...stages].reverse().forEach((stage) => {
    const window =
      strategy === 'resource_optimized'
        ? findLatestCapacityWindow(cursorDueDate, stage, teamCapacity, roleUsage)
        : {
            startDate: subtractDays(cursorDueDate, Math.max(stage.slaDays - 1, 0)),
            dueDate: cursorDueDate,
          };

    reserveRoleWindow(roleUsage, stage.roleKey, window.startDate, window.dueDate);
    stageMap[stage.code] = {
      stageCode: stage.code,
      startDate: window.startDate,
      dueDate: window.dueDate,
      owner: getRoleLabel(stage.roleKey),
    };
    cursorDueDate = subtractDays(window.startDate, 1);
  });

  return {
    productId: product.id,
    productName: product.name,
    module,
    stages: stageMap,
  };
}

function planProductForward(
  product: ProductRow,
  module: ModuleCode,
  baselineStartDate: string,
  teamCapacity: TeamCapacity,
  roleUsage: Record<keyof TeamCapacity, Map<string, number>>,
): ProductPlanRow {
  const stages = WORKFLOW_BY_MODULE[module];
  const stageMap: Record<string, StagePlanCell> = {};
  let cursorStartDate = baselineStartDate;

  stages.forEach((stage) => {
    const window = findEarliestCapacityWindow(cursorStartDate, stage, teamCapacity, roleUsage);
    reserveRoleWindow(roleUsage, stage.roleKey, window.startDate, window.dueDate);
    stageMap[stage.code] = {
      stageCode: stage.code,
      startDate: window.startDate,
      dueDate: window.dueDate,
      owner: getRoleLabel(stage.roleKey),
    };
    cursorStartDate = addDays(window.dueDate, 1);
  });

  return {
    productId: product.id,
    productName: product.name,
    module,
    stages: stageMap,
  };
}

function buildProductPlanRow(
  product: ProductRow,
  module: ModuleCode,
  baselineStartDate: string,
  productOffset: number,
) {
  return planProductForward(
    product,
    module,
    addDays(baselineStartDate, productOffset),
    DEFAULT_CAPACITY,
    createEmptyRoleUsage(),
  );
}

function buildDeterministicPlan(
  order: OrderRow,
  products: ProductRow[],
  baselineStartDate: string,
  strategy: PlanningStrategy,
  teamCapacity: TeamCapacity,
  bottlenecks: string,
): PlanningPayload {
  const roleUsage = createEmptyRoleUsage();

  return {
    version: 1,
    strategy,
    baselineStartDate,
    generatedAt: new Date().toISOString(),
    teamCapacity,
    bottlenecks,
    products: Object.fromEntries(
      products.map((product) => {
        const module = normalizeModule(product, order);
        const row =
          strategy === 'fastest_delivery'
            ? planProductForward(product, module, baselineStartDate, teamCapacity, roleUsage)
            : planProductBackward(product, module, order.deadline || baselineStartDate, strategy, teamCapacity, roleUsage);
        return [product.id, row];
      }),
    ),
  };
}

function coercePlanningPayload(order: OrderRow | null, products: ProductRow[], baselineStartDate: string): PlanningPayload {
  const raw = order?.stage_sla_overrides;
  const storedPlanning = raw && typeof raw === 'object' && 'planning' in raw ? (raw as { planning?: Partial<PlanningPayload> }).planning : null;

  if (storedPlanning?.products && order) {
    const normalizedProducts = Object.fromEntries(
      products.map((product) => {
        const module = normalizeModule(product, order);
        const existing = storedPlanning.products?.[product.id] as ProductPlanRow | undefined;
        return [product.id, existing || buildProductPlanRow(product, module, storedPlanning.baselineStartDate || baselineStartDate, 0)];
      }),
    );

    return {
      version: 1,
      strategy: storedPlanning.strategy || 'backward',
      baselineStartDate: storedPlanning.baselineStartDate || baselineStartDate,
      generatedAt: storedPlanning.generatedAt || new Date().toISOString(),
      teamCapacity: { ...DEFAULT_CAPACITY, ...(storedPlanning.teamCapacity || {}) },
      bottlenecks: String(storedPlanning.bottlenecks || ''),
      products: normalizedProducts,
    };
  }

  if (!order) {
    return {
      version: 1,
      strategy: 'backward',
      baselineStartDate,
      generatedAt: new Date().toISOString(),
      teamCapacity: { ...DEFAULT_CAPACITY },
      bottlenecks: '',
      products: {},
    };
  }

  return buildDeterministicPlan(order, products, baselineStartDate, 'backward', DEFAULT_CAPACITY, '');
}

function extractDateRange(plan: PlanningPayload) {
  const cells = Object.values(plan.products).flatMap((product) => Object.values(product.stages));
  const starts = cells.map((cell) => cell.startDate).filter(Boolean).sort();
  const dues = cells.map((cell) => cell.dueDate).filter(Boolean).sort();
  return {
    firstStart: starts[0] || '-',
    lastDue: dues[dues.length - 1] || '-',
  };
}

function buildGanttColumns(plan: PlanningPayload | null, mode: GanttMode) {
  if (!plan) return [] as string[];
  const range = extractDateRange(plan);
  if (range.firstStart === '-' || range.lastDue === '-') return [];

  if (mode === 'day') {
    const days = diffDays(range.firstStart, range.lastDue);
    return Array.from({ length: days + 1 }, (_value, index) => addDays(range.firstStart, index));
  }

  const weekStart = startOfWeek(range.firstStart);
  const weekCount = Math.max(0, Math.ceil((diffDays(weekStart, range.lastDue) + 1) / 7));
  return Array.from({ length: weekCount + 1 }, (_value, index) => addDays(weekStart, index * 7));
}

function buildDeadlineWarnings(order: OrderRow | null, plan: PlanningPayload | null) {
  if (!order || !plan || !order.deadline) return [] as string[];
  const warnings: string[] = [];

  Object.values(plan.products).forEach((product) => {
    Object.values(product.stages).forEach((stage) => {
      if (stage.dueDate && stage.dueDate > order.deadline) {
        warnings.push(`${product.productId} ${stage.stageCode} vuot deadline client (${stage.dueDate} > ${order.deadline}).`);
      }
    });
  });

  return warnings;
}

function buildCapacityWarnings(plan: PlanningPayload | null, mode: GanttMode) {
  if (!plan) return [] as string[];
  const counts = new Map<string, Record<string, number>>();

  Object.values(plan.products).forEach((product) => {
    const stages = WORKFLOW_BY_MODULE[product.module];
    stages.forEach((stageMeta) => {
      const stage = product.stages[stageMeta.code];
      if (!stage?.startDate || !stage?.dueDate) return;

      eachDateInclusive(stage.startDate, stage.dueDate).forEach((date) => {
        const bucket = mode === 'week' ? startOfWeek(date) : date;
        const current = counts.get(bucket) || {};
        current[stageMeta.roleKey] = (current[stageMeta.roleKey] || 0) + 1;
        counts.set(bucket, current);
      });
    });
  });

  const warnings: string[] = [];
  counts.forEach((roles, bucket) => {
    (Object.keys(DEFAULT_CAPACITY) as Array<keyof TeamCapacity>).forEach((roleKey) => {
      const assigned = roles[roleKey] || 0;
      const capacity = plan.teamCapacity[roleKey];
      if (assigned > capacity && capacity > 0) {
        warnings.push(`${bucket}: ${getRoleLabel(roleKey)} dang tai ${assigned}/${capacity}.`);
      }
      if (capacity === 0 && assigned > 0) {
        warnings.push(`${bucket}: ${getRoleLabel(roleKey)} chua co nang luc nhung dang duoc plan ${assigned} task-ngay.`);
      }
    });
  });

  return warnings;
}

function buildGanttSegments(row: ProductPlanRow, mode: GanttMode, columns: string[]) {
  return WORKFLOW_BY_MODULE[row.module]
    .map((stageMeta) => {
      const stage = row.stages[stageMeta.code];
      if (!stage?.startDate || !stage?.dueDate) return null;
      const startKey = mode === 'week' ? startOfWeek(stage.startDate) : stage.startDate;
      const endKey = mode === 'week' ? startOfWeek(stage.dueDate) : stage.dueDate;
      const startIndex = columns.indexOf(startKey);
      const endIndex = columns.indexOf(endKey);
      if (startIndex < 0 || endIndex < 0) return null;
      return {
        stageCode: stageMeta.code,
        owner: stage.owner,
        startIndex,
        span: Math.max(endIndex - startIndex + 1, 1),
        tone: moduleTone(row.module),
      };
    })
    .filter(Boolean) as Array<{ stageCode: string; owner: string; startIndex: number; span: number; tone: 'violet' | 'danger' | 'success' }>;
}

function createStageBreakdown() {
  return Object.fromEntries(STAGE_BREAKDOWN_COLUMNS.map((step) => [step, 0])) as Record<string, number>;
}

function buildPortfolioRows(orders: OrderRow[], products: ProductRow[]) {
  return orders.map((order) => {
    const orderProducts = products.filter((product) => product.order_id === order.id);
    const moduleCounts = orderProducts.reduce(
      (acc, product) => {
        const module = normalizeModule(product, order);
        acc[module] += 1;
        return acc;
      },
      { ELN: 0, VIDEO: 0, GAME: 0 },
    );

    const stageBreakdown = createStageBreakdown();
    let workloadDays = 0;

    orderProducts.forEach((product) => {
      const module = normalizeModule(product, order);
      WORKFLOW_BY_MODULE[module].forEach((stage) => {
        const stepCode = stage.code.split('-')[1];
        if (stepCode) {
          stageBreakdown[stepCode] = (stageBreakdown[stepCode] || 0) + 1;
        }
        workloadDays += stage.slaDays;
      });
    });

    return {
      order,
      productCount: orderProducts.length,
      moduleCounts,
      workloadDays,
      stageBreakdown,
    };
  });
}

function buildProductTooltip(row: ProductPlanRow) {
  const stages = Object.values(row.stages);
  const starts = stages.map((stage) => stage.startDate).filter(Boolean).sort();
  const dues = stages.map((stage) => stage.dueDate).filter(Boolean).sort();
  const firstStart = starts[0] || '-';
  const lastDue = dues[dues.length - 1] || '-';

  return [
    row.productName,
    `Module: ${row.module}`,
    `Product ID: ${row.productId}`,
    `Timeline: ${firstStart} -> ${lastDue}`,
  ].join('\n');
}

export function PlanningSetupPage() {
  const queryClient = useQueryClient();
  const ordersQuery = useQuery({ queryKey: ['orders'], queryFn: listOrdersWithProducts });
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [baselineStartDate, setBaselineStartDate] = useState(toIsoDate(new Date()));
  const [draftPlan, setDraftPlan] = useState<PlanningPayload | null>(null);
  const [ganttMode, setGanttMode] = useState<GanttMode>('week');
  const [planningStrategy, setPlanningStrategy] = useState<PlanningStrategy>('backward');

  const orders = ordersQuery.data?.orders || [];
  const products = ordersQuery.data?.products || [];

  useEffect(() => {
    if (!selectedOrderId && orders[0]?.id) {
      setSelectedOrderId(orders[0].id);
    }
  }, [orders, selectedOrderId]);

  const selectedOrder = useMemo(() => orders.find((order) => order.id === selectedOrderId) || null, [orders, selectedOrderId]);
  const selectedProducts = useMemo(() => products.filter((product) => product.order_id === selectedOrderId), [products, selectedOrderId]);
  const portfolioRows = useMemo(() => buildPortfolioRows(orders, products), [orders, products]);

  useEffect(() => {
    if (!selectedOrder) return;
    const initialBaseline = selectedOrder.launched_at?.slice(0, 10) || selectedOrder.submitted_at?.slice(0, 10) || toIsoDate(new Date());
    const payload = coercePlanningPayload(selectedOrder, selectedProducts, initialBaseline);
    setBaselineStartDate(payload.baselineStartDate);
    setPlanningStrategy(payload.strategy || 'backward');
    setDraftPlan(payload);
  }, [selectedOrder, selectedProducts]);

  const groupedByModule = useMemo(() => {
    if (!selectedOrder || !draftPlan) return {} as Record<ModuleCode, ProductPlanRow[]>;
    return selectedProducts.reduce(
      (acc, product) => {
        const module = normalizeModule(product, selectedOrder);
        const row = draftPlan.products[product.id];
        if (row) acc[module].push(row);
        return acc;
      },
      { ELN: [], VIDEO: [], GAME: [] } as Record<ModuleCode, ProductPlanRow[]>,
    );
  }, [draftPlan, selectedOrder, selectedProducts]);

  const selectedPortfolioRow = useMemo(
    () => portfolioRows.find((row) => row.order.id === selectedOrderId) || null,
    [portfolioRows, selectedOrderId],
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOrder || !draftPlan) throw new Error('Chua co order hoac planning payload.');
      await updateOrder(selectedOrder.id, {
        stage_sla_overrides: {
          ...(selectedOrder.stage_sla_overrides && typeof selectedOrder.stage_sla_overrides === 'object' ? selectedOrder.stage_sla_overrides : {}),
          planning: {
            ...draftPlan,
            strategy: planningStrategy,
            baselineStartDate,
            generatedAt: new Date().toISOString(),
          },
        },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  function applyDeterministicPlan(strategy: PlanningStrategy) {
    if (!selectedOrder) return;
    const nextCapacity = draftPlan?.teamCapacity || DEFAULT_CAPACITY;
    const nextBottlenecks = draftPlan?.bottlenecks || '';
    const nextPlan = buildDeterministicPlan(selectedOrder, selectedProducts, baselineStartDate, strategy, nextCapacity, nextBottlenecks);
    setPlanningStrategy(strategy);
    setDraftPlan(nextPlan);
  }

  function regeneratePlan(staggerDays: number) {
    if (!selectedOrder || !draftPlan) return;
    setPlanningStrategy('fastest_delivery');
    setDraftPlan({
      ...draftPlan,
      strategy: 'fastest_delivery',
      baselineStartDate,
      generatedAt: new Date().toISOString(),
      products: Object.fromEntries(
        selectedProducts.map((product, index) => {
          const module = normalizeModule(product, selectedOrder);
          return [product.id, buildProductPlanRow(product, module, baselineStartDate, index * staggerDays)];
        }),
      ),
    });
  }

  function updateStageField(productId: string, stageCode: string, field: keyof StagePlanCell, value: string) {
    setDraftPlan((current) => {
      if (!current?.products[productId]) return current;
      return {
        ...current,
        products: {
          ...current.products,
          [productId]: {
            ...current.products[productId],
            stages: {
              ...current.products[productId].stages,
              [stageCode]: {
                ...current.products[productId].stages[stageCode],
                [field]: value,
              },
            },
          },
        },
      };
    });
  }

  function updateCapacity(roleKey: keyof TeamCapacity, value: string) {
    setDraftPlan((current) =>
      current
        ? {
            ...current,
            teamCapacity: {
              ...current.teamCapacity,
              [roleKey]: Math.max(0, Number(value) || 0),
            },
          }
        : current,
    );
  }

  const planRange = draftPlan ? extractDateRange(draftPlan) : { firstStart: '-', lastDue: '-' };
  const deadlineWarnings = buildDeadlineWarnings(selectedOrder, draftPlan);
  const capacityWarnings = buildCapacityWarnings(draftPlan, ganttMode);
  const ganttColumns = buildGanttColumns(draftPlan, ganttMode);
  const totalOrders = portfolioRows.length;
  const totalProducts = portfolioRows.reduce((sum, row) => sum + row.productCount, 0);
  const totalWorkloadDays = portfolioRows.reduce((sum, row) => sum + row.workloadDays, 0);

  return (
    <>
      <SectionHeader
        eye="AI Production Planner"
        title="Thiết lập kế hoạch"
        subtitle="Admin xem tổng quan order, số sản phẩm theo order, breakdown khối lượng theo SMF/VSMF/GSMF và tạo kế hoạch theo deadline, capacity, bottleneck."
        actions={
          <>
            <button className="btn btn-ghost" onClick={() => setGanttMode((current) => (current === 'week' ? 'day' : 'week'))} disabled={!draftPlan}>
              Gantt {ganttMode === 'week' ? 'theo ngay' : 'theo tuan'}
            </button>
            <button className="btn btn-ghost" onClick={() => regeneratePlan(0)} disabled={!selectedOrder}>
              Auto-fill SLA
            </button>
            <button className="btn btn-ghost" onClick={() => regeneratePlan(1)} disabled={!selectedOrder}>
              Apply pattern
            </button>
            <button className="btn btn-primary" onClick={() => applyDeterministicPlan(planningStrategy)} disabled={!selectedOrder}>
              AI Plan
            </button>
            <button className="btn btn-primary" onClick={() => saveMutation.mutate()} disabled={!selectedOrder || !draftPlan || saveMutation.isPending}>
              {saveMutation.isPending ? 'Đang lưu...' : 'Lưu kế hoạch'}
            </button>
          </>
        }
      />

      <div className="kpi-row">
        <Kpi label="Tổng order" value={String(totalOrders)} sub="Phạm vi admin" tone="danger" />
        <Kpi label="Tổng sản phẩm" value={String(totalProducts)} sub="Tổng khối lượng active" tone="warning" />
        <Kpi label="Workload days" value={String(totalWorkloadDays)} sub="Tổng SLA toàn portfolio" tone="violet" />
        <Kpi label="Selected strategy" value={getStrategyLabel(planningStrategy)} sub="Planner deterministic" tone="success" />
      </div>

      <Card title="1. Tổng quan portfolio">
        <table className="data-table planning-portfolio-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Deadline</th>
              <th>Products</th>
              <th>Module mix</th>
              <th>Workload</th>
              {STAGE_BREAKDOWN_COLUMNS.map((step) => (
                <th key={step}>SMF-{step}</th>
              ))}
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {portfolioRows.map((row) => (
              <tr key={row.order.id} className={row.order.id === selectedOrderId ? 'is-selected-row' : ''}>
                <td>
                  <div className="list-title">{row.order.id}</div>
                  <div className="muted-text">{row.order.title}</div>
                  <div className="muted-text">{row.order.client}</div>
                </td>
                <td>{row.order.deadline || '-'}</td>
                <td>{row.productCount}</td>
                <td>
                  <div className="stack compact">
                    <Badge tone="violet">ELN {row.moduleCounts.ELN}</Badge>
                    <Badge tone="danger">VIDEO {row.moduleCounts.VIDEO}</Badge>
                    <Badge tone="success">GAME {row.moduleCounts.GAME}</Badge>
                  </div>
                </td>
                <td>{row.workloadDays} ngày-SLA</td>
                {STAGE_BREAKDOWN_COLUMNS.map((step) => (
                  <td key={`${row.order.id}-${step}`}>{row.stageBreakdown[step] || 0}</td>
                ))}
                <td>
                  <button className="btn btn-ghost btn-small" onClick={() => setSelectedOrderId(row.order.id)}>
                    Chọn order
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {(['ELN', 'VIDEO', 'GAME'] as ModuleCode[]).map((module) => {
        const rows = groupedByModule[module] || [];
        if (!rows.length) return null;
        const stages = WORKFLOW_BY_MODULE[module];

        return (
          <Card key={module} title={`2. ${module} matrix ke hoach`} action={<Badge tone={moduleTone(module)}>{module} · {rows.length} product</Badge>}>
            <table className="matrix-table planning-matrix">
              <thead>
                <tr>
                  <th>San pham</th>
                  {stages.map((stage) => (
                    <th key={stage.code}>
                      <div>{stage.label}</div>
                      <div className="muted-text">SLA: {stage.slaDays} ngay · Role: {getRoleLabel(stage.roleKey)}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.productId}>
                    <td>
                      <div className="product-code-chip" title={buildProductTooltip(row)}>
                        {row.productId}
                      </div>
                    </td>
                    {stages.map((stage) => {
                      const cell = row.stages[stage.code];
                      return (
                        <td key={stage.code}>
                          <div className="planning-cell">
                            <input type="date" value={cell?.startDate || ''} onChange={(event) => updateStageField(row.productId, stage.code, 'startDate', event.target.value)} />
                            <input type="date" value={cell?.dueDate || ''} onChange={(event) => updateStageField(row.productId, stage.code, 'dueDate', event.target.value)} />
                            <input value={cell?.owner || ''} placeholder={getRoleLabel(stage.roleKey)} onChange={(event) => updateStageField(row.productId, stage.code, 'owner', event.target.value)} />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        );
      })}

      <Card title="3. Chọn order và điều khiển planner">
        <div className="form-grid">
          <label>
            <span>Đơn hàng</span>
            <select value={selectedOrderId} onChange={(event) => setSelectedOrderId(event.target.value)}>
              {orders.map((order) => {
                const productCount = products.filter((product) => product.order_id === order.id).length;
                return (
                  <option key={order.id} value={order.id}>
                    {order.id} - {order.title} ({productCount} sản phẩm)
                  </option>
                );
              })}
            </select>
          </label>
          <label>
            <span>Ngày bắt đầu baseline</span>
            <input
              type="date"
              value={baselineStartDate}
              onChange={(event) => {
                const nextValue = event.target.value;
                setBaselineStartDate(nextValue);
                setDraftPlan((current) => (current ? { ...current, baselineStartDate: nextValue } : current));
              }}
            />
          </label>
          <label>
            <span>Deadline client</span>
            <input value={selectedOrder?.deadline || '-'} readOnly />
          </label>
          <label>
            <span>Planner strategy</span>
            <select value={planningStrategy} onChange={(event) => setPlanningStrategy(event.target.value as PlanningStrategy)}>
              <option value="backward">Backward planning</option>
              <option value="resource_optimized">Resource optimized</option>
              <option value="fastest_delivery">Fastest delivery</option>
            </select>
          </label>
          <div className="planner-strategy-box">
            <div className="planner-strategy-title">{getStrategyLabel(planningStrategy)}</div>
            <div className="muted-text">{getStrategyDescription(planningStrategy)}</div>
          </div>
          <div className="planner-strategy-box">
            <div className="planner-strategy-title">Order snapshot</div>
            <div className="muted-text">
              {selectedPortfolioRow
                ? `${selectedPortfolioRow.productCount} product · ${selectedPortfolioRow.workloadDays} ngay-SLA · deadline ${selectedPortfolioRow.order.deadline || '-'}`
                : 'Chọn order để xem scope.'}
            </div>
          </div>
        </div>
      </Card>

      <Card title="4. Team capacity và bottleneck">
        <div className="form-grid">
          {(Object.keys(DEFAULT_CAPACITY) as Array<keyof TeamCapacity>).map((roleKey) => (
            <label key={roleKey}>
              <span>{getRoleLabel(roleKey)}</span>
              <input
                type="number"
                min="0"
                value={draftPlan?.teamCapacity[roleKey] ?? DEFAULT_CAPACITY[roleKey]}
                onChange={(event) => updateCapacity(roleKey, event.target.value)}
              />
            </label>
          ))}
          <label className="full">
            <span>Bottleneck / ghi chú planning</span>
            <textarea
              value={draftPlan?.bottlenecks || ''}
              placeholder="Ví dụ: QC chỉ có 1 người, voice team nghẽn 2 ngày, game dev phụ thuộc review khách hàng..."
              onChange={(event) =>
                setDraftPlan((current) => (current ? { ...current, bottlenecks: event.target.value } : current))
              }
            />
          </label>
        </div>
      </Card>

      <div className="content-grid two-column">
        <Card title="6. Cảnh báo xung đột deadline">
          <div className="stack compact">
            {deadlineWarnings.length ? deadlineWarnings.map((warning) => <div key={warning} className="bullet-item tone-danger">{warning}</div>) : <div className="bullet-item">Không có stage nào vượt deadline client.</div>}
          </div>
        </Card>

        <Card title="7. Cảnh báo tài nguyên / bottleneck">
          <div className="stack compact">
            {capacityWarnings.length ? capacityWarnings.map((warning) => <div key={warning} className="bullet-item tone-warning">{warning}</div>) : <div className="bullet-item">Tài nguyên hiện tại chưa thấy điểm nghẽn rõ ràng theo plan.</div>}
          </div>
        </Card>
      </div>
      <div className="kpi-row small">
        <Kpi
          label="Scope order"
          value={selectedOrder ? selectedOrder.module : '-'}
          sub={selectedOrder ? `${selectedOrder.id} - ${selectedOrder.client}` : 'Chưa chọn order'}
          tone="danger"
        />
        <Kpi label="Số sản phẩm" value={String(selectedProducts.length)} sub="Đồng bộ từ bundle product hiện tại" tone="warning" />
        <Kpi label="Range timeline" value={planRange.lastDue} sub={`Start ${planRange.firstStart}`} tone="success" />
      </div>

      <Card title="5. Tổng quan timeline">
        <div className="stack compact">
          <div className="bullet-item">Strategy: {getStrategyLabel(planningStrategy)}</div>
          <div className="bullet-item">Bắt đầu sớm nhất: {planRange.firstStart}</div>
          <div className="bullet-item">Kết thúc muộn nhất: {planRange.lastDue}</div>
          <div className="bullet-item">ELN rows: {groupedByModule.ELN?.length || 0}</div>
          <div className="bullet-item">VIDEO rows: {groupedByModule.VIDEO?.length || 0}</div>
          <div className="bullet-item">GAME rows: {groupedByModule.GAME?.length || 0}</div>
          <div className="bullet-item">Mode Gantt: {ganttMode === 'week' ? 'Theo tuan' : 'Theo ngay'}</div>
        </div>
      </Card>

      <Card title={`8. Gantt ${ganttMode === 'week' ? 'theo tuan' : 'theo ngay'}`}>
        <div className="planning-gantt">
          <table className="matrix-table gantt-table">
            <thead>
              <tr>
                <th>San pham</th>
                {ganttColumns.map((column) => (
                  <th key={column}>{ganttMode === 'week' ? `W ${column.slice(5)}` : column.slice(5)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.values(draftPlan?.products || {}).map((row) => {
                const segments = buildGanttSegments(row, ganttMode, ganttColumns);
                return (
                  <tr key={row.productId}>
                    <td>
                      <div className="product-code-chip" title={buildProductTooltip(row)}>
                        {row.productId}
                      </div>
                    </td>
                    {ganttColumns.map((column, index) => {
                      const segment = segments.find((item) => index >= item.startIndex && index < item.startIndex + item.span);
                      const isStart = segment?.startIndex === index;
                      return (
                        <td key={column}>
                          {segment ? (
                            <div className={`gantt-chip tone-${segment.tone}${isStart ? ' start' : ''}`}>
                              {isStart ? segment.stageCode : ''}
                            </div>
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

    </>
  );
}

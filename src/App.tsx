import React, { useState, useMemo, useEffect, useRef } from 'react';
import calculatorIllustration from '@/imports/Illustatorrrr.png';
import noMeterIllustration from '@/imports/Draft_empty_illustration.png';
import readyEmptyIllustration from '@/imports/Ready_empty_illustration.png';
import sendIllustration from '@/imports/Send_illustration.png';
import deleteIllustration from '@/imports/Delete_illustration.png';
import iconInvoice from '@/imports/Icon_invoice-1.png';
import {
  MagnifyingGlass,
  Funnel,
  X,
  CalendarBlank,
  Lightning,
  Drop,
  WarningCircle,
  Calculator,
  Receipt,
  Trash,
  PaperPlaneRight,
  CaretRight,
  CaretLeft,
  CellSignalFull,
  WifiHigh,
  BatteryFull,
  House,
  CheckCircle
} from '@phosphor-icons/react';

// --- Types ---
type TabType = 'draft' | 'ready' | 'sent';

type UtilityStatus = 'Approved' | 'Waiting approval' | 'No data' | 'Inactive';

interface UtilityData {
  status: UtilityStatus;
  prev?: number;
  curr?: number;
  usage?: number;
}

interface DraftUnit {
  id: string;
  unitNumber: string;
  month: string;
  electric: UtilityData;
  water: UtilityData;
}

interface ReadyInvoice {
  id: string;
  unitNumber: string;
  month: string;
  status: 'Ready to sent' | 'Zero amount';
  amount: number;
  invoiceNumber?: string;
  isSent?: boolean;
  sentStatus?: SentInvoice['status'];
}

interface SentInvoice {
  id: string;
  unitNumber: string;
  month: string;
  dueDate: string;
  status: 'Unpaid' | 'Overdue' | 'Paid';
  amount: number;
  invoiceNumber?: string;
  overdueDays?: number;
}

interface CalcLogEntry {
  unitNumber: string;
  status: 'success' | 'error';
  message?: string;
  messages?: string[];
}

function getLogMessages(entry: CalcLogEntry): string[] {
  if (entry.messages && entry.messages.length > 0) return entry.messages;
  return entry.message ? [entry.message] : [];
}

function RenderEntryMessages({ entry }: { entry: CalcLogEntry }) {
  const msgs = getLogMessages(entry);
  if (msgs.length <= 1) {
    return (
      <p className={`text-[11px] leading-snug mt-0.5 ${
        entry.status === 'success' ? 'text-green-600' : 'text-red-500'
      }`}>
        {msgs[0] || ''}
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-1.5 mt-1">
      {msgs.map((msg, idx) => (
        <div key={idx} className={`flex items-start gap-1.5 text-[11px] leading-snug ${
          entry.status === 'success' ? 'text-green-600' : 'text-red-500'
        }`}>
          <span className="shrink-0 text-red-400 font-bold">•</span>
          <span>{msg}</span>
        </div>
      ))}
    </div>
  );
}

// --- Mock Data ---
const mockDrafts: DraftUnit[] = [
  { id: 'd1',  unitNumber: 'A1201', month: 'Jul 2026', electric: { status: 'Approved', prev: 12500, curr: 12850, usage: 350 }, water: { status: 'Approved', prev: 140, curr: 155, usage: 15 } },
  { id: 'dFAIL1', unitNumber: 'X9999', month: 'Jul 2026', electric: { status: 'Approved', prev: 15200, curr: 14800, usage: 400 }, water: { status: 'Approved', prev: 300, curr: 310, usage: 10 } },
  { id: 'dFAIL2', unitNumber: 'Y1010', month: 'Jul 2026', electric: { status: 'Approved', prev: 8800, curr: 8500, usage: 300 }, water: { status: 'Approved', prev: 150, curr: 160, usage: 10 } },
  { id: 'dFAIL3', unitNumber: 'Y2020', month: 'Jul 2026', water: { status: 'Approved', prev: 220, curr: 200, usage: 20 }, electric: { status: 'Approved', prev: 5000, curr: 5300, usage: 300 } },
  { id: 'dFAIL4', unitNumber: 'Z0011', month: 'Jul 2026', electric: { status: 'Approved', prev: 12100, curr: 11900, usage: 200 }, water: { status: 'Approved', prev: 80, curr: 90, usage: 10 } },
  { id: 'dFAIL5', unitNumber: 'Z0022', month: 'Jul 2026', electric: { status: 'Approved', prev: 9400, curr: 9100, usage: 300 }, water: { status: 'Approved', prev: 200, curr: 215, usage: 15 } },

  { id: 'd2',  unitNumber: 'A1202', month: 'Jul 2026', electric: { status: 'Waiting approval', prev: 11000, curr: 11200, usage: 200 }, water: { status: 'Approved', prev: 120, curr: 130, usage: 10 } },
  { id: 'd3',  unitNumber: 'A1203', month: 'Jul 2026', electric: { status: 'Inactive' }, water: { status: 'Approved', prev: 98, curr: 110, usage: 12 } },
  { id: 'd4',  unitNumber: 'B0405', month: 'Jul 2026', electric: { status: 'Approved', prev: 5400, curr: 5620, usage: 220 }, water: { status: 'No data' } },
  { id: 'd5',  unitNumber: 'B0501', month: 'Jul 2026', electric: { status: 'Approved', prev: 8200, curr: 8530, usage: 330 }, water: { status: 'Approved', prev: 210, curr: 225, usage: 15 } },
  { id: 'd6',  unitNumber: 'B0502', month: 'Jul 2026', electric: { status: 'Approved', prev: 6100, curr: 6390, usage: 290 }, water: { status: 'Approved', prev: 175, curr: 188, usage: 13 } },
  { id: 'd7',  unitNumber: 'B0503', month: 'Jul 2026', electric: { status: 'No data' }, water: { status: 'No data' } },
  { id: 'd8',  unitNumber: 'C0601', month: 'Jul 2026', electric: { status: 'Approved', prev: 9300, curr: 9650, usage: 350 }, water: { status: 'Waiting approval', prev: 305, curr: 318, usage: 13 } },
  { id: 'd9',  unitNumber: 'C0602', month: 'Jul 2026', electric: { status: 'Approved', prev: 4200, curr: 4410, usage: 210 }, water: { status: 'Approved', prev: 88, curr: 97, usage: 9 } },
  { id: 'd10', unitNumber: 'C0603', month: 'Jul 2026', electric: { status: 'Inactive' }, water: { status: 'Inactive' } },
  { id: 'd11', unitNumber: 'C0604', month: 'Jul 2026', electric: { status: 'Approved', prev: 7700, curr: 8020, usage: 320 }, water: { status: 'Approved', prev: 250, curr: 264, usage: 14 } },
  { id: 'd12', unitNumber: 'D1001', month: 'Jul 2026', electric: { status: 'Waiting approval', prev: 13200, curr: 13500, usage: 300 }, water: { status: 'Waiting approval', prev: 410, curr: 425, usage: 15 } },
  { id: 'd13', unitNumber: 'D1002', month: 'Jul 2026', electric: { status: 'Approved', prev: 3900, curr: 4100, usage: 200 }, water: { status: 'Approved', prev: 67, curr: 74, usage: 7 } },
  { id: 'd14', unitNumber: 'D1003', month: 'Jul 2026', electric: { status: 'Approved', prev: 10500, curr: 10830, usage: 330 }, water: { status: 'No data' } },
  { id: 'd15', unitNumber: 'D1004', month: 'Jul 2026', electric: { status: 'Inactive' }, water: { status: 'Approved', prev: 155, curr: 168, usage: 13 } },
  { id: 'd16', unitNumber: 'E0201', month: 'Jul 2026', electric: { status: 'Approved', prev: 6800, curr: 7050, usage: 250 }, water: { status: 'Approved', prev: 190, curr: 203, usage: 13 } },
  { id: 'd17', unitNumber: 'E0202', month: 'Jul 2026', electric: { status: 'No data' }, water: { status: 'Approved', prev: 112, curr: 121, usage: 9 } },
  { id: 'd18', unitNumber: 'E0203', month: 'Jul 2026', electric: { status: 'Approved', prev: 5100, curr: 5340, usage: 240 }, water: { status: 'Approved', prev: 78, curr: 86, usage: 8 } },
  { id: 'd19', unitNumber: 'E0204', month: 'Jul 2026', electric: { status: 'Waiting approval', prev: 8800, curr: 9100, usage: 300 }, water: { status: 'Inactive' } },
  { id: 'd20', unitNumber: 'F1101', month: 'Jul 2026', electric: { status: 'Approved', prev: 11300, curr: 11600, usage: 300 }, water: { status: 'Approved', prev: 320, curr: 335, usage: 15 } },
  { id: 'd21', unitNumber: 'F1102', month: 'Jul 2026', electric: { status: 'Approved', prev: 4600, curr: 4830, usage: 230 }, water: { status: 'Approved', prev: 95, curr: 104, usage: 9 } },
  { id: 'd22', unitNumber: 'F1103', month: 'Jul 2026', electric: { status: 'No data' }, water: { status: 'No data' } },
  { id: 'd23', unitNumber: 'F1104', month: 'Jul 2026', electric: { status: 'Approved', prev: 7200, curr: 7490, usage: 290 }, water: { status: 'Waiting approval', prev: 230, curr: 244, usage: 14 } },
  { id: 'd24', unitNumber: 'G0301', month: 'Jul 2026', electric: { status: 'Approved', prev: 9900, curr: 10210, usage: 310 }, water: { status: 'Approved', prev: 285, curr: 298, usage: 13 } },
  { id: 'd25', unitNumber: 'G0302', month: 'Jul 2026', electric: { status: 'Inactive' }, water: { status: 'No data' } },
  { id: 'd26', unitNumber: 'H0101', month: 'Jul 2026', electric: { status: 'Approved', prev: 8100, curr: 8420, usage: 320 }, water: { status: 'Approved', prev: 190, curr: 204, usage: 14 } },
  { id: 'd27', unitNumber: 'H0102', month: 'Jul 2026', electric: { status: 'Approved', prev: 6300, curr: 6570, usage: 270 }, water: { status: 'Approved', prev: 145, curr: 158, usage: 13 } },
  { id: 'd28', unitNumber: 'H0103', month: 'Jul 2026', electric: { status: 'Approved', prev: 11200, curr: 11530, usage: 330 }, water: { status: 'Approved', prev: 310, curr: 326, usage: 16 } },
  { id: 'd29', unitNumber: 'H0104', month: 'Jul 2026', electric: { status: 'Approved', prev: 4800, curr: 5060, usage: 260 }, water: { status: 'Approved', prev: 88, curr: 99, usage: 11 } },
  { id: 'd30', unitNumber: 'H0201', month: 'Jul 2026', electric: { status: 'Approved', prev: 9400, curr: 9730, usage: 330 }, water: { status: 'Approved', prev: 270, curr: 284, usage: 14 } },
  { id: 'd31', unitNumber: 'H0202', month: 'Jul 2026', electric: { status: 'Approved', prev: 7600, curr: 7890, usage: 290 }, water: { status: 'Approved', prev: 220, curr: 233, usage: 13 } },
  { id: 'd32', unitNumber: 'H0203', month: 'Jul 2026', electric: { status: 'Approved', prev: 5500, curr: 5780, usage: 280 }, water: { status: 'Approved', prev: 130, curr: 142, usage: 12 } },
  { id: 'd33', unitNumber: 'H0301', month: 'Jul 2026', electric: { status: 'Approved', prev: 13100, curr: 13450, usage: 350 }, water: { status: 'Approved', prev: 390, curr: 406, usage: 16 } },
  { id: 'd34', unitNumber: 'H0302', month: 'Jul 2026', electric: { status: 'Approved', prev: 3700, curr: 3950, usage: 250 }, water: { status: 'Approved', prev: 72, curr: 83, usage: 11 } },
  { id: 'd35', unitNumber: 'H0303', month: 'Jul 2026', electric: { status: 'Approved', prev: 10100, curr: 10420, usage: 320 }, water: { status: 'Approved', prev: 260, curr: 274, usage: 14 } },
];

const initialReady: ReadyInvoice[] = [
  { id: 'r1', unitNumber: 'C0801', month: 'Jul 2026', status: 'Ready to sent', amount: 1250000, invoiceNumber: 'PRO/INV/072026/039391' },
  { id: 'r2', unitNumber: 'C0802', month: 'Jul 2026', status: 'Ready to sent', amount: 980000, invoiceNumber: 'PRO/INV/072026/039392' },
  { id: 'r3', unitNumber: 'C0803', month: 'Jul 2026', status: 'Zero amount', amount: 0, invoiceNumber: 'PRO/INV/072026/039393' },
  { id: 'rFAIL1', unitNumber: 'X9999', month: 'Jul 2026', status: 'Ready to sent', amount: 1450000, invoiceNumber: 'PRO/INV/072026/039394' },
  { id: 'rFAIL2', unitNumber: 'Y1010', month: 'Jul 2026', status: 'Ready to sent', amount: 890000, invoiceNumber: 'PRO/INV/072026/039395' },
  { id: 'rFAIL3', unitNumber: 'Z0011', month: 'Jul 2026', status: 'Ready to sent', amount: 1120000, invoiceNumber: 'PRO/INV/072026/039396' },
];

const simulateAmount = (unit: DraftUnit): number => {
  const elec = unit.electric.usage ?? 0;
  const water = unit.water.usage ?? 0;
  return elec * 1500 + water * 8000;
};

const mockSent: SentInvoice[] = [
  { id: 's1', unitNumber: 'D-1001', month: 'Jun 2026', dueDate: '15 Jul 2026', status: 'Unpaid', amount: 1100000, invoiceNumber: 'PRO/INV/062026/011001' },
  { id: 's2', unitNumber: 'D-1002', month: 'May 2026', dueDate: '15 Jun 2026', status: 'Overdue', amount: 1450000, invoiceNumber: 'PRO/INV/052026/011002', overdueDays: 51 },
  { id: 's3', unitNumber: 'D-1003', month: 'Jun 2026', dueDate: '15 Jul 2026', status: 'Paid', amount: 890000, invoiceNumber: 'PRO/INV/062026/011003' },
];

// --- Helper Functions ---
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

const canCalculate = (unit: DraftUnit) => {
  const isOk = (s: UtilityStatus) => s === 'Approved' || s === 'Inactive';
  const hasApproved = unit.electric.status === 'Approved' || unit.water.status === 'Approved';
  return isOk(unit.electric.status) && isOk(unit.water.status) && hasApproved;
};

const SWIPE_THRESHOLD = 72;

function SwipeToDelete({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) {
  const [offsetX, setOffsetX] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const startX = React.useRef(0);
  const startY = React.useRef(0);
  const isLocked = React.useRef<'swipe' | 'scroll' | null>(null);
  const revealed = offsetX <= -SWIPE_THRESHOLD;

  function onPointerDown(e: React.PointerEvent) {
    startX.current = e.clientX;
    startY.current = e.clientY;
    isLocked.current = null;
    setIsDragging(true);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!isDragging) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;
    if (isLocked.current === null) {
      if (Math.abs(dx) > Math.abs(dy) + 4) {
        isLocked.current = 'swipe';
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } else if (Math.abs(dy) > Math.abs(dx) + 4) {
        isLocked.current = 'scroll';
      }
    }
    if (isLocked.current !== 'swipe') return;
    const next = Math.min(0, Math.max(-SWIPE_THRESHOLD - 8, dx + (revealed ? -SWIPE_THRESHOLD : 0)));
    setOffsetX(next);
  }

  function onPointerUp() {
    setIsDragging(false);
    if (isLocked.current !== 'swipe') return;
    setOffsetX(offsetX <= -SWIPE_THRESHOLD / 2 ? -SWIPE_THRESHOLD : 0);
  }

  function close() { setOffsetX(0); }

  return (
    <div className="relative rounded-lg overflow-hidden">
      <div className="absolute inset-y-0 right-0 w-20 bg-red-500 rounded-lg flex items-center justify-center">
        <button
          onClick={() => { close(); onDelete(); }}
          className="flex flex-col items-center justify-center gap-1 w-full h-full text-white"
        >
          <Trash size={22} weight="fill" />
          <span className="text-[10px] font-bold">Delete</span>
        </button>
      </div>

      <div
        className="relative select-none"
        style={{ transform: `translateX(${offsetX}px)`, transition: isDragging ? 'none' : 'transform 0.25s ease' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {children}
      </div>
    </div>
  );
}

function EmptyState({ tab, onReset }: { tab?: 'draft' | 'ready' | 'sent'; onReset?: () => void }) {
  const isDraft = tab === 'draft';
  return (
    <div className="flex flex-col items-center justify-center py-12 px-8 text-center min-h-[60vh]">
      {isDraft ? (
        <img src={noMeterIllustration} alt="" className="rounded-2xl mb-3 object-cover" style={{width: 267, height: 200}} />
      ) : (
        <img src={readyEmptyIllustration} alt="" className="rounded-2xl mb-3 object-cover" style={{width: 267, height: 200}} />
      )}
      <p className="font-bold text-slate-500 text-base mb-1">
        {isDraft ? 'No meter scan data' : 'No invoices found'}
      </p>
      <p className="text-slate-400 text-sm leading-relaxed">
        {isDraft
          ? 'No units match your search or filter.'
          : 'No invoices match your search or filter.'}
      </p>
      {onReset && (
        <button
          onClick={onReset}
          className="mt-5 px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-dark transition-colors"
        >
          Reset demo data
        </button>
      )}
    </div>
  );
}

function formatFullMonth(monthStr: string): string {
  const monthMap: Record<string, string> = {
    Jan: 'January', Feb: 'February', Mar: 'March', Apr: 'April', May: 'May', Jun: 'June',
    Jul: 'July', Aug: 'August', Sep: 'September', Oct: 'October', Nov: 'November', Dec: 'December'
  };
  const parts = monthStr.split(' ');
  if (parts.length === 2 && monthMap[parts[0]]) {
    return `${monthMap[parts[0]]} ${parts[1]}`;
  }
  return monthStr;
}

function getInvoiceNumber(invoice: { id: string; month: string; unitNumber: string; invoiceNumber?: string }): string {
  if (invoice.invoiceNumber) return invoice.invoiceNumber;
  const monthMap: Record<string, string> = {
    Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
    Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
  };
  const parts = invoice.month.split(' ');
  const mm = monthMap[parts[0]] || '08';
  const yyyy = parts[1] || '2026';
  const suffix = invoice.id.replace(/[^0-9]/g, '').padStart(6, '0').slice(-6) || '039393';
  return `PRO/INV/${mm}${yyyy}/${suffix}`;
}

function ReadyStatusBadge({ status }: { status: ReadyInvoice['status'] }) {
  const isZero = status === 'Zero amount';
  return (
    <span className={`inline-block w-fit px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-white ${
      isZero ? 'bg-red-500' : 'bg-primary'
    }`}>
      {isZero ? 'Zero Amount' : 'Ready to Send'}
    </span>
  );
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<'menu' | 'monthly'>('menu');
  const [selectedMenuToast, setSelectedMenuToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('draft');
  const [searchQuery, setSearchQuery] = useState('');
  const [drafts, setDrafts] = useState<DraftUnit[]>(mockDrafts);
  const [readyInvoices, setReadyInvoices] = useState<ReadyInvoice[]>(initialReady);
  const [sentToDeleteId, setSentToDeleteId] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState(0);
  const [selectedInvoice, setSelectedInvoice] = useState<ReadyInvoice | null>(null);
  
  // Selection states
  const [selectedDrafts, setSelectedDrafts] = useState<Set<string>>(new Set());
  const [selectedReady, setSelectedReady] = useState<Set<string>>(new Set());
  const [selectedSent, setSelectedSent] = useState<Set<string>>(new Set());
  
  // Filter states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState<string>('');
  const [filterStatuses, setFilterStatuses] = useState<Set<string>>(new Set());

  // Modals
  const [modalState, setModalState] = useState<'none' | 'calculate' | 'calculate-all-period' | 'calculate-all' | 'send' | 'delete' | 'calculating' | 'sending' | 'success'>('none');
  const [calcAllMonth, setCalcAllMonth] = useState('');
  const [calcAllYear, setCalcAllYear] = useState('');
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  // Calculate flow states
  const [calcProgress, setCalcProgress] = useState(0);
  const [calcTotal, setCalcTotal] = useState(0);
  const calcDoneCallback = useRef<(() => void) | null>(null);
  const [calcLogs, setCalcLogs] = useState<CalcLogEntry[]>([]);
  const [calcComplete, setCalcComplete] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<'success' | 'failed' | null>(null);

  // Send flow states
  const [sentInvoices, setSentInvoices] = useState<SentInvoice[]>(mockSent);
  const [sendProgress, setSendProgress] = useState(0);
  const [sendTotal, setSendTotal] = useState(0);
  const sendDoneCallback = useRef<(() => void) | null>(null);
  const [sendLogs, setSendLogs] = useState<CalcLogEntry[]>([]);
  const [sendComplete, setSendComplete] = useState(false);
  const [openSendAccordion, setOpenSendAccordion] = useState<'success' | 'failed' | null>(null);
  const [sendSuccessCount, setSendSuccessCount] = useState(0);


  // Filtered Data
  const filteredDrafts = useMemo(() => {
    return drafts.filter((d: DraftUnit) => {
      const matchSearch = d.unitNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchPeriod = filterPeriod ? d.month === filterPeriod : true;
      const matchStatus = filterStatuses.size === 0 || 
        filterStatuses.has(d.electric.status) || filterStatuses.has(d.water.status);
      return matchSearch && matchPeriod && matchStatus;
    });
  }, [searchQuery, filterPeriod, filterStatuses]);

  const filteredReady = useMemo(() => {
    return readyInvoices.filter(r => {
      const matchSearch = r.unitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchPeriod = filterPeriod ? r.month === filterPeriod : true;
      const matchStatus = filterStatuses.size === 0 || filterStatuses.has(r.status);
      return matchSearch && matchPeriod && matchStatus;
    });
  }, [readyInvoices, searchQuery, filterPeriod, filterStatuses]);

  const filteredSent = useMemo(() => {
    return sentInvoices.filter(s => {
      const matchSearch = s.unitNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchPeriod = filterPeriod ? s.month === filterPeriod : true;
      const matchStatus = filterStatuses.size === 0 || filterStatuses.has(s.status);
      return matchSearch && matchPeriod && matchStatus;
    });
  }, [sentInvoices, searchQuery, filterPeriod, filterStatuses]);

  // Handlers
  const toggleDraftSelection = (id: string) => {
    const newSet = new Set(selectedDrafts);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedDrafts(newSet);
  };

  const toggleAllDrafts = () => {
    const calculable = filteredDrafts.filter(canCalculate);
    const allSelected = calculable.length > 0 && calculable.every(d => selectedDrafts.has(d.id));
    
    if (allSelected) {
      setSelectedDrafts(newSet => {
        const next = new Set(newSet);
        calculable.forEach(d => next.delete(d.id));
        return next;
      });
    } else {
      setSelectedDrafts(newSet => {
        const next = new Set(newSet);
        calculable.forEach(d => next.add(d.id));
        return next;
      });
    }
  };

  const toggleReadySelection = (id: string) => {
    const newSet = new Set(selectedReady);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedReady(newSet);
  };

  const toggleAllReady = () => {
    const sendable = filteredReady.filter(r => r.status !== 'Zero amount');
    const allSelected = sendable.length > 0 && sendable.every(r => selectedReady.has(r.id));
    
    if (allSelected) {
      setSelectedReady(newSet => {
        const next = new Set(newSet);
        sendable.forEach(r => next.delete(r.id));
        return next;
      });
    } else {
      setSelectedReady(newSet => {
        const next = new Set(newSet);
        sendable.forEach(r => next.add(r.id));
        return next;
      });
    }
  };

  const toggleSentSelection = (id: string) => {
    const newSet = new Set(selectedSent);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedSent(newSet);
  };

  const toggleAllSent = () => {
    const allSelected = filteredSent.length > 0 && filteredSent.every(s => selectedSent.has(s.id));
    if (allSelected) {
      setSelectedSent(new Set());
    } else {
      setSelectedSent(new Set(filteredSent.map(s => s.id)));
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setFilterStatuses(new Set()); // Reset status filters on tab change
    setSearchQuery('');
    setSelectedSent(new Set());
  };

  const removeFilterStatus = (status: string) => {
    const newSet = new Set(filterStatuses);
    newSet.delete(status);
    setFilterStatuses(newSet);
  };

  const resetFilters = () => {
    setFilterPeriod('');
    setFilterStatuses(new Set());
  };

  const runCalculation = (toCalculate: DraftUnit[], onDone: (newReady: ReadyInvoice[], successIds: Set<string>) => void) => {
    const newReady: ReadyInvoice[] = [];
    const logs: CalcLogEntry[] = [];
    const successIds = new Set<string>();

    toCalculate.forEach(d => {
      const errMsgs: string[] = [];
      if (d.electric.prev !== undefined && d.electric.curr !== undefined && d.electric.curr < d.electric.prev) {
        errMsgs.push(`Electric meter: current (${d.electric.curr}) < previous (${d.electric.prev}) — invalid meter data.`);
      }
      if (d.water.prev !== undefined && d.water.curr !== undefined && d.water.curr < d.water.prev) {
        errMsgs.push(`Water meter: current (${d.water.curr}) < previous (${d.water.prev}) — invalid meter data.`);
      }
      if (d.unitNumber === 'X9999' || d.unitNumber === 'Z0022') {
        errMsgs.push("Water meter: reading missing required supervisor approval.");
        errMsgs.push("Utility tariff schedule rate expired for period July 2026.");
      }

      if (errMsgs.length > 0) {
        logs.push({
          unitNumber: d.unitNumber,
          status: 'error',
          messages: errMsgs,
        });
      } else {
        const amount = simulateAmount(d);
        const invNum = `PRO/INV/072026/${Math.floor(100000 + Math.random() * 900000)}`;
        newReady.push({
          id: `r-${d.id}-${Date.now()}`,
          unitNumber: d.unitNumber,
          month: d.month,
          status: 'Ready to sent' as const,
          amount,
          invoiceNumber: invNum,
        });
        successIds.add(d.id);
        logs.push({
          unitNumber: d.unitNumber,
          status: 'success',
          message: `Invoice generated — ${formatCurrency(amount)}`,
        });
      }
    });

    setCalcLogs(logs);
    setCalcComplete(false);
    setOpenAccordion(null);
    const total = toCalculate.length;
    calcDoneCallback.current = () => {
      onDone(newReady, successIds);
      setSuccessCount(newReady.length);
    };
    setCalcTotal(total);
    setCalcProgress(0);
    setModalState('calculating');
  };

  useEffect(() => {
    if (modalState !== 'calculating' || calcTotal === 0) return;

    const DURATION = Math.max(1500, calcTotal * 120);
    const startTime = performance.now();
    let raf: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const pct = Math.min(elapsed / DURATION, 1);
      // ease-out: fast start, slow finish
      const eased = 1 - Math.pow(1 - pct, 3);
      setCalcProgress(Math.round(eased * calcTotal));

      if (pct < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        // When done: finalize data and show results — do NOT auto-navigate away
        setTimeout(() => {
          calcDoneCallback.current?.();
          setCalcComplete(true);
        }, 300);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [modalState, calcTotal]);

  // Send Progress Animation
  useEffect(() => {
    if (modalState !== 'sending' || sendTotal === 0) return;
    let raf: number;
    let currentProgress = 0;
    const durationPerItem = 400;
    let lastTime = performance.now();

    const tick = (now: number) => {
      if (now - lastTime >= durationPerItem) {
        lastTime = now;
        currentProgress += 1;
        setSendProgress(Math.min(currentProgress, sendTotal));
      }

      if (currentProgress < sendTotal) {
        raf = requestAnimationFrame(tick);
      } else {
        setTimeout(() => {
          setSendComplete(true);
          sendDoneCallback.current?.();
        }, 300);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [modalState, sendTotal]);

  const runSending = (toSend: ReadyInvoice[]) => {
    const newSent: SentInvoice[] = [];
    const logs: CalcLogEntry[] = [];
    const sentIds = new Set<string>();

    toSend.forEach(inv => {
      const errMsgs: string[] = [];
      if (inv.status === 'Zero amount' || inv.amount === 0) {
        errMsgs.push('Cannot send invoice — total amount is Rp 0.');
        errMsgs.push('Building service charge breakdown missing in master file.');
      }
      if (inv.unitNumber === 'X9999' || inv.id === 'rFAIL1') {
        errMsgs.push('Tenant email address (invalid@tenant.com) bounce check failed.');
        errMsgs.push('ProApps mobile app account #88392 is disabled/inactive.');
        errMsgs.push('WhatsApp notification gateway delivery timeout (code 504).');
      } else if (inv.unitNumber === 'Y1010' || inv.id === 'rFAIL2') {
        errMsgs.push('ProApps tenant account inactive.');
        errMsgs.push('Primary contact phone number not registered.');
      } else if (inv.unitNumber === 'Z0011' || inv.id === 'rFAIL3') {
        errMsgs.push('Network timeout on notification gateway.');
      }

      if (errMsgs.length > 0) {
        logs.push({
          unitNumber: inv.unitNumber,
          status: 'error',
          messages: errMsgs,
        });
      } else {
        newSent.push({
          id: `s-${inv.id}-${Date.now()}`,
          unitNumber: inv.unitNumber,
          month: inv.month,
          dueDate: '25 Aug 2026',
          status: 'Unpaid' as const,
          amount: inv.amount,
          invoiceNumber: getInvoiceNumber(inv),
        });
        sentIds.add(inv.id);
        logs.push({
          unitNumber: inv.unitNumber,
          status: 'success',
          message: 'Invoice sent to ProApps tenant & tenant email',
        });
      }
    });

    setSendLogs(logs);
    setSendComplete(false);
    setOpenSendAccordion(null);
    setSendTotal(toSend.length);
    setModalState('sending');

    sendDoneCallback.current = () => {
      setSentInvoices(prev => [...newSent, ...prev]);
      setReadyInvoices(prev => prev.filter(r => !sentIds.has(r.id)));
      setSelectedReady(new Set());
      setSendSuccessCount(newSent.length);
    };
  };

  const handleCalculateSelected = () => {
    const toCalculate = drafts.filter(d => selectedDrafts.has(d.id) && canCalculate(d));
    runCalculation(toCalculate, (newReady, successIds) => {
      setReadyInvoices(prev => [...prev, ...newReady]);
      // Only remove units that succeeded; failed units stay in draft for correction
      setDrafts(prev => prev.filter(d => !successIds.has(d.id)));
      setSelectedDrafts(new Set());
    });
  };

  const handleCalculateAll = () => {
    const toCalculate = drafts.filter(canCalculate);
    runCalculation(toCalculate, (newReady, successIds) => {
      setReadyInvoices(prev => [...prev, ...newReady]);
      // Only remove units that succeeded; failed units stay in draft for correction
      setDrafts(prev => prev.filter(d => !successIds.has(d.id)));
      setSelectedDrafts(new Set());
      setCalcAllMonth('');
      setCalcAllYear('');
    });
  };

  return (
    <div className="flex flex-col h-screen bg-background text-secondary max-w-md mx-auto relative overflow-hidden shadow-2xl ring-1 ring-black/5">
      {currentPage === 'menu' ? (
        <div className="flex flex-col h-full bg-background relative">
          {/* Header */}
          <div className="bg-white pb-0 border-b border-slate-100 shrink-0">
            {/* Status Bar */}
            <div className="flex justify-between items-center px-5 py-3.5 text-slate-800">
              <span className="text-[14px] font-bold tracking-tight">9:41</span>
              <div className="flex items-center gap-1.5">
                <CellSignalFull size={16} weight="fill" />
                <WifiHigh size={16} weight="bold" />
                <BatteryFull size={20} weight="fill" />
              </div>
            </div>

            {/* Title Bar */}
            <div className="flex items-center px-5 my-6 relative justify-center">
              <button className="absolute left-5 p-1 -ml-1 text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
                <CaretLeft size={24} weight="bold" />
              </button>
              <h1 className="text-lg font-bold text-slate-800">Invoice</h1>
            </div>
          </div>

          {/* Menu Options List */}
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3.5">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Invoice Category</p>

            {/* 1. Monthly Invoice Card */}
            <button
              onClick={() => setCurrentPage('monthly')}
              className="w-full bg-white rounded-xl p-4 flex items-center gap-4 hover:border-primary/40 transition-all text-left group cursor-pointer border border-slate-200/80 active:scale-[0.99]"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                <CalendarBlank size={24} weight="fill" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 text-base mb-0.5">Monthly Invoice</h3>
                <p className="text-xs text-slate-500 font-medium">Utility bill, service charge & sinking fund bill</p>
              </div>
              <CaretRight size={18} weight="bold" className="text-slate-400 group-hover:text-primary transition-colors shrink-0" />
            </button>

            {/* 2. Other Invoice Card */}
            <button
              onClick={() => setSelectedMenuToast('Other Invoice')}
              className="w-full bg-white rounded-xl p-4 flex items-center gap-4 hover:border-purple-300 transition-all text-left group cursor-pointer border border-slate-200/80 active:scale-[0.99]"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Receipt size={24} weight="fill" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 text-base mb-0.5">Other Invoice</h3>
                <p className="text-xs text-slate-500 font-medium">Ad-hoc fees, penalties & miscellaneous charges</p>
              </div>
              <CaretRight size={18} weight="bold" className="text-slate-400 group-hover:text-purple-600 transition-colors shrink-0" />
            </button>

            {/* 3. Lease Invoice Card */}
            <button
              onClick={() => setSelectedMenuToast('Lease Invoice')}
              className="w-full bg-white rounded-xl p-4 flex items-center gap-4 hover:border-blue-300 transition-all text-left group cursor-pointer border border-slate-200/80 active:scale-[0.99]"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <House size={24} weight="fill" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 text-base mb-0.5">Lease Invoice</h3>
                <p className="text-xs text-slate-500 font-medium">Unit rental fees, service charges & sinking fund</p>
              </div>
              <CaretRight size={18} weight="bold" className="text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
            </button>
          </div>

          {/* Toast Notification */}
          {selectedMenuToast && (
            <div className="absolute bottom-6 left-6 right-6 z-50 bg-slate-900/90 backdrop-blur-md text-white text-xs font-semibold px-4 py-3 rounded-xl flex items-center justify-between shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-200">
              <span>{selectedMenuToast} will be available in the next update.</span>
              <button onClick={() => setSelectedMenuToast(null)} className="ml-2 text-slate-400 hover:text-white">
                <X size={14} weight="bold" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
      {/* Header & Tabs */}
      <header className="bg-white pb-0 border-b border-slate-100 z-10 shrink-0">
        {/* Status Bar */}
        <div className="flex justify-between items-center px-5 py-3.5 text-slate-800">
          <span className="text-[14px] font-bold tracking-tight">9:41</span>
          <div className="flex items-center gap-1.5">
            <CellSignalFull size={16} weight="fill" />
            <WifiHigh size={16} weight="bold" />
            <BatteryFull size={20} weight="fill" />
          </div>
        </div>

        {/* Title Bar */}
        <div className="flex items-center px-5 my-6 relative justify-center">
          <button onClick={() => setCurrentPage('menu')} className="absolute left-5 p-1 -ml-1 text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
            <CaretLeft size={24} weight="bold" />
          </button>
          <h1 className="text-lg font-bold text-slate-800">Monthly Invoice</h1>
        </div>
        
        <div className="flex w-full relative px-5">
          {(['draft', 'ready', 'sent'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`flex-1 pb-3 text-sm font-semibold capitalize transition-colors relative ${
                activeTab === tab ? 'text-primary' : 'text-slate-500'
              }`}
            >
              {tab === 'ready' ? 'Ready to Send' : tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-md" />
              )}
            </button>
          ))}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-slate-200 -z-10" />
        </div>
      </header>

      {/* Search and Filters */}
      <div className="bg-white px-5 py-3.5 shrink-0 flex flex-col gap-3 border-b border-slate-100 z-10">
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} weight="bold" />
            <input
              type="text"
              placeholder="Search invoice or unit number"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 rounded-xl py-3 pl-10 pr-4 text-[13px] text-slate-500 placeholder:text-slate-400 focus:outline-none transition-all"
            />
          </div>
          <button
            onClick={() => setIsFilterOpen(true)}
            className="w-11 h-11 flex items-center justify-center bg-white rounded-lg border border-slate-200 text-secondary hover:bg-slate-50 transition-colors shrink-0"
          >
            <svg width="16" height="13" viewBox="0 0 20 16" fill="none">
              <path d="M1 1.5H19" stroke="#334155" strokeWidth="2" strokeLinecap="round"/>
              <path d="M4 8H16" stroke="#334155" strokeWidth="2" strokeLinecap="round"/>
              <path d="M7 14.5H13" stroke="#334155" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Active Filters */}
        {(filterPeriod || filterStatuses.size > 0) && (
          <div className="flex flex-wrap gap-2 items-center">
            {filterPeriod && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700">
                {filterPeriod}
                <button onClick={() => setFilterPeriod('')}><X size={12} weight="bold" /></button>
              </span>
            )}
            {Array.from(filterStatuses).map(status => (
              <span key={status} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700">
                {status}
                <button onClick={() => removeFilterStatus(status)}><X size={12} weight="bold" /></button>
              </span>
            ))}
            <button onClick={resetFilters} className="text-xs font-semibold text-primary ml-1 hover:underline">
              Reset all
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto overscroll-contain bg-background pb-32">
        
        {/* TAB: DRAFT */}
        {activeTab === 'draft' && (
          <div className="flex flex-col gap-4">
            {/* Select All Row - Sticky */}
            {filteredDrafts.length > 0 && (
              <div className="sticky top-0 z-10 bg-primary-light flex justify-between items-center px-6 py-3 border-b border-primary/10">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <RoundedCheckbox
                    checked={filteredDrafts.filter(canCalculate).length > 0 && filteredDrafts.filter(canCalculate).every(d => selectedDrafts.has(d.id))}
                    onChange={toggleAllDrafts}
                  />
                  <span className="text-sm font-medium">Select all</span>
                </label>
                {selectedDrafts.size > 0 && (
                  <span className="text-sm text-slate-500 font-medium">{selectedDrafts.size} units selected</span>
                )}
              </div>
            )}

            {/* List */}
            {filteredDrafts.length === 0 && (
              <EmptyState
                tab="draft"
                onReset={drafts.length === 0 ? () => setDrafts(mockDrafts) : undefined}
              />
            )}
            <div className="px-5 flex flex-col gap-4 pb-4">
            {filteredDrafts.map(unit => {
              const eligible = canCalculate(unit);
              const checked = selectedDrafts.has(unit.id);
              return (
                <div
                  key={unit.id}
                  className={`bg-white rounded-lg overflow-hidden transition-all duration-200 ${
                    checked ? 'ring-2 ring-primary/20' : ''
                  } ${!eligible ? 'opacity-75' : ''}`}
                >

                  {/* Card Header */}
                  <div className={`flex items-center justify-between px-4 pt-4 pb-3.5 transition-colors ${checked ? 'bg-primary/[0.04]' : ''}`}>
                    <div className="flex items-center gap-3">
                      <RoundedCheckbox
                        checked={checked}
                        onChange={() => toggleDraftSelection(unit.id)}
                        disabled={!eligible}
                      />
                      <div className="flex items-center gap-2">
                        <House size={18} weight="fill" className="text-primary shrink-0" />
                        <span className="text-[14px] font-semibold text-secondary">{unit.unitNumber}</span>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 transition-colors duration-150 ${checked ? 'bg-primary' : 'bg-slate-50 border border-slate-100'}`}>
                      <CalendarBlank size={14} className={checked ? 'text-white' : 'text-secondary'} />
                      <span className={`text-[12px] font-medium ${checked ? 'text-white' : 'text-secondary'}`}>{unit.month}</span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-slate-100 mx-4" />

                  {/* Utility Section - Full Width Stacked */}
                  <div className="p-4 flex flex-col gap-3">

                    {/* Electric Panel */}
                    <div className="bg-amber-50/60 rounded-lg p-3.5 flex flex-col gap-2.5 border border-amber-100/60">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                            <Lightning size={16} weight="fill" />
                          </div>
                          <span className="text-[13px] font-bold text-slate-800">Electric</span>
                          <UtilityStatusBadge status={unit.electric.status} />
                        </div>

                        {(unit.electric.status === 'Approved' || unit.electric.status === 'Waiting approval') && (
                          <div className="flex items-baseline gap-1 bg-amber-400 rounded-[4px] px-2 py-1 shrink-0">
                            <span className="text-[14px] font-bold text-white leading-none">{unit.electric.usage !== undefined ? Math.abs(unit.electric.usage) : 0}</span>
                            <span className="text-[12px] font-semibold text-amber-100">kWh used</span>
                          </div>
                        )}
                      </div>

                      {unit.electric.status === 'No data' && (
                        <p className="text-[12px] font-medium text-slate-400 pl-9">Meter not scanned yet</p>
                      )}
                      {unit.electric.status === 'Inactive' && (
                        <p className="text-[12px] font-medium text-slate-400 pl-9">No electricity meter for this unit</p>
                      )}

                      {(unit.electric.status === 'Approved' || unit.electric.status === 'Waiting approval') && (
                        <div className="flex items-center justify-between bg-white/80 rounded-md px-3 py-2 border border-amber-100/80">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Previous</span>
                            <span className="text-[13px] font-bold text-slate-800">{unit.electric.prev}</span>
                          </div>
                          <span className="text-slate-300 font-bold text-sm">→</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Current</span>
                            <span className="text-[13px] font-bold text-slate-800">{unit.electric.curr}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Water Panel */}
                    <div className="bg-blue-50/50 rounded-lg p-3.5 flex flex-col gap-2.5 border border-blue-100/60">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                            <Drop size={16} weight="fill" />
                          </div>
                          <span className="text-[13px] font-bold text-slate-800">Water</span>
                          <UtilityStatusBadge status={unit.water.status} />
                        </div>

                        {(unit.water.status === 'Approved' || unit.water.status === 'Waiting approval') && (
                          <div className="flex items-baseline gap-1 bg-blue-500 rounded-[4px] px-2 py-1 shrink-0">
                            <span className="text-[14px] font-bold text-white leading-none">{unit.water.usage !== undefined ? Math.abs(unit.water.usage) : 0}</span>
                            <span className="text-[12px] font-semibold text-blue-100">m³ used</span>
                          </div>
                        )}
                      </div>

                      {unit.water.status === 'No data' && (
                        <p className="text-[12px] font-medium text-slate-400 pl-9">Meter not scanned yet</p>
                      )}
                      {unit.water.status === 'Inactive' && (
                        <p className="text-[12px] font-medium text-slate-400 pl-9">No water meter for this unit</p>
                      )}

                      {(unit.water.status === 'Approved' || unit.water.status === 'Waiting approval') && (
                        <div className="flex items-center justify-between bg-white/80 rounded-md px-3 py-2 border border-blue-100/80">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Previous</span>
                            <span className="text-[13px] font-bold text-slate-800">{unit.water.prev}</span>
                          </div>
                          <span className="text-slate-300 font-bold text-sm">→</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Current</span>
                            <span className="text-[13px] font-bold text-slate-800">{unit.water.curr}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Warning Footer */}
                  {!eligible && !unit.willFail && (
                    <div className="flex items-center gap-2 bg-amber-50 border-t border-amber-100/80 px-4 py-2.5">
                      <WarningCircle size={20} weight="fill" className="text-amber-500 shrink-0" />
                      <span className="text-amber-700 text-[12px] font-medium">Cannot be calculated — meter data incomplete</span>
                    </div>
                  )}
                </div>
              )
            })}
            </div>
          </div>
        )}

        {/* TAB: READY */}
        {activeTab === 'ready' && (
          <div className="flex flex-col gap-4">
            {filteredReady.length > 0 && (
              <div className="sticky top-0 z-10 bg-primary-light flex justify-between items-center px-6 py-3 border-b border-primary/10">
                <label className="flex items-center gap-3 cursor-pointer">
                  <RoundedCheckbox
                    checked={filteredReady.filter(r => r.status !== 'Zero amount').length > 0 && filteredReady.filter(r => r.status !== 'Zero amount').every(r => selectedReady.has(r.id))}
                    onChange={toggleAllReady}
                  />
                  <span className="text-sm font-medium">Select all</span>
                </label>
                {selectedReady.size > 0 && (
                  <span className="text-sm text-slate-500 font-medium">{selectedReady.size} units selected</span>
                )}
              </div>
            )}

            {filteredReady.length === 0 && <EmptyState />}
            <div className="px-5 flex flex-col gap-4 pb-4">
              {filteredReady.map(invoice => {
                const isZero = invoice.status === 'Zero amount';
                const checked = selectedReady.has(invoice.id);
                const invNo = getInvoiceNumber(invoice);
                const card = (
                  <div
                    onClick={() => setSelectedInvoice(invoice)}
                    className={`bg-white rounded-lg p-3.5 transition-all flex flex-col gap-2.5 cursor-pointer ${isZero ? 'opacity-60' : ''}`}
                  >
                    {/* Top Bar: Checkbox + Invoice Number + Status Badge */}
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/70">
                      <div className="flex items-center gap-2 min-w-0" onPointerDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
                        <RoundedCheckbox
                          checked={checked}
                          onChange={() => toggleReadySelection(invoice.id)}
                          disabled={isZero}
                        />
                        <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100/90 px-2 py-0.5 rounded tracking-tight truncate">
                          {invNo}
                        </span>
                      </div>
                      <ReadyStatusBadge status={invoice.status} />
                    </div>

                    {/* Main Content: Original Invoice Icon Image + Unit/Month Info + Amount + Caret */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl shrink-0 overflow-hidden">
                        <img src={iconInvoice} alt="invoice" className="w-full h-full object-cover" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 text-sm truncate">Unit {invoice.unitNumber}</h3>
                        <p className="text-[13px] text-slate-500 font-semibold">{formatFullMonth(invoice.month)} Bill</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`font-bold text-sm ${isZero ? 'text-red-500' : 'text-slate-900'}`}>
                          {formatCurrency(invoice.amount)}
                        </span>
                        <CaretRight size={14} weight="bold" className="text-slate-300" />
                      </div>
                    </div>
                  </div>
                );

              return isZero ? <React.Fragment key={invoice.id}>{card}</React.Fragment> : (
                <SwipeToDelete
                  key={invoice.id}
                  onDelete={() => { setItemToDelete(invoice.unitNumber); setModalState('delete'); }}
                >
                  {card}
                </SwipeToDelete>
              );
            })}
            </div>
          </div>
        )}

        {/* TAB: SENT */}
        {activeTab === 'sent' && (
          <div className="flex flex-col gap-4">
            {filteredSent.length > 0 && (
              <div className="sticky top-0 z-10 bg-primary-light flex justify-between items-center px-6 py-3 border-b border-primary/10">
                <label className="flex items-center gap-3 cursor-pointer">
                  <RoundedCheckbox
                    checked={filteredSent.length > 0 && filteredSent.every(s => selectedSent.has(s.id))}
                    onChange={toggleAllSent}
                  />
                  <span className="text-sm font-medium">Select all</span>
                </label>
                {selectedSent.size > 0 && (
                  <span className="text-sm text-slate-500 font-medium">{selectedSent.size} invoices selected</span>
                )}
              </div>
            )}

            {filteredSent.length === 0 && <EmptyState />}
            <div className="px-5 flex flex-col gap-4 pb-4">
              {filteredSent.map(invoice => {
                const invNo = getInvoiceNumber(invoice);
                const checked = selectedSent.has(invoice.id);
                return (
                  <div
                    key={invoice.id}
                    onClick={() => setSelectedInvoice({
                      id: invoice.id,
                      unitNumber: invoice.unitNumber,
                      month: invoice.month,
                      status: 'Ready to sent',
                      amount: invoice.amount,
                      invoiceNumber: invNo,
                      isSent: true,
                      sentStatus: invoice.status,
                    })}
                    className="bg-white rounded-lg overflow-hidden transition-all cursor-pointer"
                  >
                    {/* Card Content */}
                    <div className="p-3.5 flex flex-col gap-2.5">
                      {/* Top Bar: Checkbox + Invoice Number + Status Badge */}
                      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/70">
                        <div className="flex items-center gap-2 min-w-0" onPointerDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
                          <RoundedCheckbox
                            checked={checked}
                            onChange={() => toggleSentSelection(invoice.id)}
                          />
                          <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100/90 px-2 py-0.5 rounded tracking-tight truncate">
                            {invNo}
                          </span>
                        </div>
                        <InvoiceStatusBadge status={invoice.status} />
                      </div>

                      {/* Main Content: Icon Thumbnail + Unit/Month Info + Amount + Caret */}
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl shrink-0 overflow-hidden">
                          <img src={iconInvoice} alt="invoice" className="w-full h-full object-cover" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-900 text-sm truncate">Unit {invoice.unitNumber}</h3>
                          <p className="text-[13px] text-slate-500 font-semibold">{formatFullMonth(invoice.month)} Bill</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-bold text-sm text-slate-900">
                            {formatCurrency(invoice.amount)}
                          </span>
                          <CaretRight size={14} weight="bold" className="text-slate-300" />
                        </div>
                      </div>
                    </div>

                    {/* Due Date / Overdue Footer Bar */}
                    {invoice.status === 'Overdue' ? (
                      <div className="flex items-center gap-2 bg-red-50 border-t border-red-100 px-4 py-2.5">
                        <WarningCircle size={16} weight="fill" className="text-red-500 shrink-0" />
                        <span className="text-red-700 text-[12px] font-bold">
                          Overdue by {invoice.overdueDays ?? 15} days — Due: {invoice.dueDate}
                        </span>
                      </div>
                    ) : invoice.status === 'Paid' ? (
                      <div className="flex items-center gap-2 bg-green-50 border-t border-green-100 px-4 py-2.5">
                        <CheckCircle size={16} weight="fill" className="text-green-500 shrink-0" />
                        <span className="text-green-700 text-[12px] font-medium">
                          Paid on time — Due: {invoice.dueDate}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-slate-50 border-t border-slate-100 px-4 py-2.5">
                        <CalendarBlank size={16} weight="fill" className="text-slate-400 shrink-0" />
                        <span className="text-slate-600 text-[12px] font-medium">Due Date: {invoice.dueDate}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Sticky Bottom Actions */}
      {activeTab === 'draft' && (
        <div className="absolute bottom-0 left-0 right-0 p-5 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] flex flex-col gap-2.5">
          {selectedDrafts.size > 0 ? (
            <div className="flex gap-3">
              <button
                onClick={() => setModalState('calculate-all-period')}
                className="flex-1 h-12 bg-white border border-primary text-primary font-bold rounded-lg flex items-center justify-center gap-2 transition-colors hover:bg-primary/5 text-sm"
              >
                Calculate All
              </button>
              <button
                onClick={() => setModalState('calculate')}
                className="flex-1 h-12 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
              >
                <Calculator size={18} weight="fill" />
                Selected ({selectedDrafts.size})
              </button>
            </div>
          ) : (
            <button
              onClick={() => setModalState('calculate-all-period')}
              className="w-full h-12 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <Calculator size={20} weight="fill" />
              Calculate All
            </button>
          )}
        </div>
      )}

      {activeTab === 'ready' && (
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          {selectedReady.size > 0 ? (
            <div className="p-5 flex flex-col gap-2">
              <div className="flex gap-3">
                <button
                  onClick={() => { setItemToDelete('selected'); setModalState('delete'); }}
                  className="h-12 px-5 flex items-center justify-center gap-2 border border-red-200 text-red-500 font-bold rounded-lg hover:bg-red-50 transition-colors text-sm shrink-0"
                >
                  <Trash size={18} weight="fill" />
                  Delete
                </button>
                <button
                  onClick={() => setModalState('send')}
                  className="flex-1 h-12 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
                >
                  <PaperPlaneRight size={20} weight="fill" />
                  Send ({selectedReady.size})
                </button>
              </div>
            </div>
          ) : (
            <div className="p-5">
              <button
                disabled
                className="w-full h-12 bg-slate-200 text-slate-400 font-bold rounded-lg flex items-center justify-center gap-2 text-sm"
              >
                <PaperPlaneRight size={20} weight="fill" />
                Send Invoice
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'sent' && selectedSent.size > 0 && (
        <div className="absolute bottom-0 left-0 right-0 p-5 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] flex flex-col gap-2.5 z-20">
          <button
            onClick={() => { setItemToDelete('selected-sent'); setModalState('delete'); }}
            className="w-full h-12 flex items-center justify-center gap-2 border border-red-200 text-red-500 font-bold rounded-lg hover:bg-red-50 transition-colors text-sm"
          >
            <Trash size={18} weight="fill" />
            Delete {selectedSent.size} Invoice{selectedSent.size > 1 ? 's' : ''}
          </button>
        </div>
      )}

      {/* --- Overlays & Modals --- */}
      
      {/* Invoice Detail Screen */}
      {selectedInvoice && (
        <div className="absolute inset-0 z-40 bg-background flex flex-col animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="bg-white shrink-0">
            <div className="flex justify-between items-center px-5 py-3.5 text-slate-800">
              <span className="text-[14px] font-bold tracking-tight">9:41</span>
              <div className="flex items-center gap-1.5">
                <CellSignalFull size={16} weight="fill" />
                <WifiHigh size={16} weight="bold" />
                <BatteryFull size={20} weight="fill" />
              </div>
            </div>
            <div className="flex items-center px-5 my-5 relative justify-center">
              <button onClick={() => setSelectedInvoice(null)} className="absolute left-5 p-1 -ml-1 text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
                <CaretLeft size={24} weight="bold" />
              </button>
              <h1 className="text-lg font-bold text-slate-800">Invoice Detail</h1>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
            {/* Status Banner */}
            <div className="bg-primary-light rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-primary/70 uppercase tracking-wider mb-1">Status</p>
                {selectedInvoice.isSent ? (
                  <InvoiceStatusBadge status={selectedInvoice.sentStatus || 'Paid'} />
                ) : (
                  <ReadyStatusBadge status={selectedInvoice.status} />
                )}
              </div>
              <div className="text-right">
                <p className="text-[11px] font-semibold text-primary/70 uppercase tracking-wider mb-1">Total Amount</p>
                <p className="text-xl font-bold text-secondary">{formatCurrency(selectedInvoice.amount)}</p>
              </div>
            </div>

            {/* Unit Info */}
            <div className="bg-white rounded-lg p-4 flex flex-col gap-3">
              <p className="text-[12px] font-bold text-secondary uppercase tracking-wider">Unit Information</p>
              <div className="h-px bg-slate-100" />
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Receipt size={16} weight="fill" className="text-primary" />
                  <span className="text-[13px] font-medium text-slate-500">Invoice No.</span>
                </div>
                <span className="text-[13px] font-mono font-bold text-slate-700 bg-slate-100/90 px-2 py-0.5 rounded">
                  {getInvoiceNumber(selectedInvoice)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <House size={16} weight="fill" className="text-primary" />
                  <span className="text-[13px] font-medium text-slate-500">Unit Number</span>
                </div>
                <span className="text-[14px] font-semibold text-secondary">{selectedInvoice.unitNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CalendarBlank size={16} weight="fill" className="text-primary" />
                  <span className="text-[13px] font-medium text-slate-500">Billing Period</span>
                </div>
                <span className="text-[14px] font-semibold text-secondary">{formatFullMonth(selectedInvoice.month)}</span>
              </div>
            </div>

            {/* Charge Breakdown */}
            <div className="bg-white rounded-lg p-4 flex flex-col gap-3">
              <p className="text-[12px] font-bold text-secondary uppercase tracking-wider">Charge Breakdown</p>
              <div className="h-px bg-slate-100" />
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-500 flex items-center justify-center">
                    <Lightning size={14} weight="fill" />
                  </div>
                  <span className="text-[13px] font-medium text-slate-500">Electricity</span>
                </div>
                <span className="text-[14px] font-semibold text-secondary">{formatCurrency(Math.round(selectedInvoice.amount * 0.7))}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-500 flex items-center justify-center">
                    <Drop size={14} weight="fill" />
                  </div>
                  <span className="text-[13px] font-medium text-slate-500">Water</span>
                </div>
                <span className="text-[14px] font-semibold text-secondary">{formatCurrency(Math.round(selectedInvoice.amount * 0.3))}</span>
              </div>
              <div className="h-px bg-slate-100" />
              <div className="flex justify-between items-center">
                <span className="text-[13px] font-bold text-secondary">Total</span>
                <span className="text-[15px] font-bold text-primary">{formatCurrency(selectedInvoice.amount)}</span>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="p-5 bg-white border-t border-slate-100 flex flex-col gap-2.5">
            {!selectedInvoice.isSent && selectedInvoice.status !== 'Zero amount' && (
              <button
                onClick={() => { setSelectedReady(new Set([selectedInvoice.id])); setSelectedInvoice(null); setModalState('send'); }}
                className="w-full h-12 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <PaperPlaneRight size={18} weight="fill" />
                Send to tenant
              </button>
            )}
            <button
              onClick={() => {
                setItemToDelete(selectedInvoice.unitNumber);
                if (selectedInvoice.isSent) {
                  setSentToDeleteId(selectedInvoice.id);
                }
                setSelectedInvoice(null);
                setModalState('delete');
              }}
              className="w-full h-12 flex items-center justify-center gap-2 border border-red-200 text-red-500 font-bold rounded-lg hover:bg-red-50 transition-colors text-sm"
            >
              <Trash size={18} weight="fill" />
              Delete Invoice
            </button>
          </div>
        </div>
      )}

      {/* Filter Bottom Sheet */}
      <BottomSheet isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} title={activeTab === 'draft' ? 'Filter Drafts' : 'Filter Invoices'}>
        <div className="flex flex-col gap-6">
          <div>
            <label className="block text-sm font-bold mb-2">
              {activeTab === 'draft' ? 'Utility Meter Period' : 'Invoice Period'}
            </label>
            <select 
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none"
            >
              <option value="">All periods</option>
              <option value="Jul 2026">July 2026</option>
              <option value="Jun 2026">June 2026</option>
              <option value="May 2026">May 2026</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold mb-3">
              {activeTab === 'draft' ? 'Meter Status' : 'Invoice Status'}
            </label>
            <div className="flex flex-wrap gap-2">
              {getRelevantStatuses(activeTab).map(status => (
                <button
                  key={status}
                  onClick={() => {
                    const newSet = new Set(filterStatuses);
                    if (newSet.has(status)) newSet.delete(status);
                    else newSet.add(status);
                    setFilterStatuses(newSet);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                    filterStatuses.has(status) 
                      ? 'bg-primary text-white border-primary' 
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              onClick={resetFilters}
              className="flex-1 py-3.5 border border-slate-300 text-slate-700 font-bold rounded-lg text-sm"
            >
              Reset
            </button>
            <button 
              onClick={() => setIsFilterOpen(false)}
              className="flex-1 py-3.5 bg-primary text-white font-bold rounded-lg text-sm"
            >
              Apply
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Calculate Modal */}
      <ConfirmModal
        isOpen={modalState === 'calculate'}
        onClose={() => setModalState('none')}
        image={calculatorIllustration}
        title="Calculate invoice?"
        description={`Invoices will be generated for ${selectedDrafts.size} selected units based on approved meter data.`}
        confirmText="Yes, calculate"
        onConfirm={handleCalculateSelected}
      />

      {/* Calculate All — Period Selection */}
      <BottomSheet isOpen={modalState === 'calculate-all-period'} onClose={() => setModalState('none')} title="Select Period">
        <div className="flex flex-col gap-6">
          <p className="text-sm text-slate-500 -mt-2">Choose the utility scan meter period for drafts you want to calculate.</p>

          <div className="flex gap-3">
            {/* Month */}
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-secondary">Month</label>
              <div className="relative">
                <select
                  value={calcAllMonth}
                  onChange={e => setCalcAllMonth(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none text-secondary"
                >
                  <option value="">Select month</option>
                  {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
                    <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>
                  ))}
                </select>
                <CaretRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Year */}
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-secondary">Year</label>
              <div className="relative">
                <select
                  value={calcAllYear}
                  onChange={e => setCalcAllYear(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none text-secondary"
                >
                  <option value="">Select year</option>
                  {[2025, 2026, 2027].map(y => (
                    <option key={y} value={String(y)}>{y}</option>
                  ))}
                </select>
                <CaretRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {calcAllMonth && calcAllYear && (
            <div className="flex items-center gap-2 bg-primary-light rounded-xl px-4 py-3">
              <CalendarBlank size={16} className="text-primary shrink-0" />
              <p className="text-[13px] text-primary font-semibold">
                {['January','February','March','April','May','June','July','August','September','October','November','December'][parseInt(calcAllMonth) - 1]} {calcAllYear}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={() => setModalState('none')} className="flex-1 py-3.5 border border-slate-300 text-slate-700 font-bold rounded-lg text-sm">
              Cancel
            </button>
            <button
              disabled={!calcAllMonth || !calcAllYear}
              onClick={() => setModalState('calculate-all')}
              className="flex-1 py-3.5 bg-primary text-white font-bold rounded-lg text-sm disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Calculate All Modal */}
      <ConfirmModal
        isOpen={modalState === 'calculate-all'}
        onClose={() => setModalState('none')}
        image={calculatorIllustration}
        title="Calculate all drafts?"
        description={`All eligible drafts for ${['January','February','March','April','May','June','July','August','September','October','November','December'][parseInt(calcAllMonth) - 1] || ''} ${calcAllYear} will be calculated. Units with incomplete meter data will be skipped.`}
        confirmText="Yes, calculate all"
        onConfirm={handleCalculateAll}
      />

      {/* Send Modal */}
      <ConfirmModal 
        isOpen={modalState === 'send'} 
        onClose={() => setModalState('none')}
        image={sendIllustration}
        title="Send invoice to tenants?"
        description={`${selectedReady.size > 0 ? selectedReady.size : readyInvoices.length} invoice(s) will be sent. This action cannot be undone.`}
        confirmText="Yes, send"
        onConfirm={() => {
          const toSend = selectedReady.size > 0 
            ? readyInvoices.filter(r => selectedReady.has(r.id))
            : readyInvoices;
          runSending(toSend);
        }}
      />

      {/* Calculating Progress Overlay */}
      {modalState === 'calculating' && (
        <div className="absolute inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" />
          {/* Hug-content sheet — grows with content, capped at 80vh */}
          <div className="bg-white w-full rounded-t-3xl relative z-10 animate-in slide-in-from-bottom duration-300" style={{maxHeight: '80vh', overflowY: 'auto'}}>

            {/* Header: drag handle + progress info */}
            <div className="p-6 pb-4">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-5" />
              <div className="flex items-center gap-4 mb-5">
                {/* Icon: spinner when animating, checkmark when done */}
                <div className="relative w-12 h-12 shrink-0">
                  {calcComplete ? (
                    <div className="absolute inset-0 rounded-full bg-primary/10 flex items-center justify-center">
                      <CheckCircle size={24} weight="fill" className="text-primary" />
                    </div>
                  ) : (
                    <>
                      <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Calculator size={18} weight="fill" className="text-primary" />
                      </div>
                    </>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold text-secondary leading-tight">
                    {calcComplete ? 'Calculation Complete' : 'Calculating invoices\u2026'}
                  </h2>
                  {!calcComplete && (
                    <p className="text-slate-400 text-xs mt-0.5">
                      {calcProgress} of {calcTotal} units processed
                    </p>
                  )}
                </div>
                <span className="text-sm font-bold text-primary shrink-0">
                  {calcTotal > 0 ? Math.round((calcProgress / calcTotal) * 100) : 0}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-200 ease-out"
                  style={{ width: calcTotal > 0 ? `${(calcProgress / calcTotal) * 100}%` : '0%' }}
                />
              </div>
            </div>

            {/* Log area */}
            <div className="px-6">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Processing log</p>

              {!calcComplete ? (
                /* Live list during animation — capped height, scrolls internally */
                <div className="overflow-y-auto" style={{maxHeight: '180px'}}>
                  <div className="flex flex-col gap-1.5 pb-2">
                    {[...calcLogs.slice(0, calcProgress)].reverse().map((entry, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg ${
                          entry.status === 'success' ? 'bg-green-50' : 'bg-red-50'
                        }`}
                      >
                        {entry.status === 'success' ? (
                          <CheckCircle size={16} weight="fill" className="text-green-500 shrink-0" />
                        ) : (
                          <WarningCircle size={16} weight="fill" className="text-red-500 shrink-0" />
                        )}
                        <span className={`text-[12px] font-bold ${
                          entry.status === 'success' ? 'text-green-700' : 'text-red-700'
                        }`}>
                          Unit {entry.unitNumber}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Accordion cards when done */
                <div className="flex flex-col gap-2 pb-2">

                  {/* Success accordion */}
                  {successCount > 0 && (
                    <div className="rounded-lg overflow-hidden border border-green-200">
                      <button
                        onClick={() => setOpenAccordion(openAccordion === 'success' ? null : 'success')}
                        className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${
                          openAccordion === 'success' ? 'bg-emerald-600 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle size={18} weight="fill" className={openAccordion === 'success' ? 'text-white' : 'text-green-500'} />
                          <span className="text-sm font-bold">{successCount} unit berhasil</span>
                        </div>
                        <CaretRight
                          size={14}
                          weight="bold"
                          className={`transition-transform duration-200 ${
                            openAccordion === 'success' ? 'rotate-90 text-white' : 'text-green-500'
                          }`}
                        />
                      </button>
                      {openAccordion === 'success' && (
                        <div className="bg-white px-4 py-3 flex flex-col gap-2 overflow-y-auto" style={{maxHeight: '200px'}}>
                          {calcLogs.filter(l => l.status === 'success').map((entry, i) => (
                            <div key={i} className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-green-50">
                              <CheckCircle size={16} weight="fill" className="text-green-500 shrink-0 mt-px" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-bold text-green-700 leading-tight">Unit {entry.unitNumber}</p>
                                <RenderEntryMessages entry={entry} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Failed accordion */}
                  {calcLogs.filter(l => l.status === 'error').length > 0 && (
                    <div className="rounded-lg overflow-hidden border border-red-200">
                      <button
                        onClick={() => setOpenAccordion(openAccordion === 'failed' ? null : 'failed')}
                        className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${
                          openAccordion === 'failed' ? 'bg-red-500 text-white' : 'bg-red-50 text-red-600 hover:bg-red-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <WarningCircle size={18} weight="fill" className={openAccordion === 'failed' ? 'text-white' : 'text-red-500'} />
                          <span className="text-sm font-bold">{calcLogs.filter(l => l.status === 'error').length} unit gagal</span>
                        </div>
                        <CaretRight
                          size={14}
                          weight="bold"
                          className={`transition-transform duration-200 ${
                            openAccordion === 'failed' ? 'rotate-90 text-white' : 'text-red-400'
                          }`}
                        />
                      </button>
                      {openAccordion === 'failed' && (
                        <div className="bg-white px-4 py-3 flex flex-col gap-2 overflow-y-auto" style={{maxHeight: '200px'}}>
                          {calcLogs.filter(l => l.status === 'error').map((entry, i) => (
                            <div key={i} className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-red-50">
                              <WarningCircle size={16} weight="fill" className="text-red-500 shrink-0 mt-px" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-bold text-red-700 leading-tight">Unit {entry.unitNumber}</p>
                                <RenderEntryMessages entry={entry} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}
            </div>

            {/* Action Buttons — only shown when calculation is done */}
            {calcComplete && (
              <div className="px-6 pb-8 pt-4 flex gap-3">
                <button
                  onClick={() => { setModalState('none'); setCalcComplete(false); }}
                  className="flex-1 h-12 border border-slate-300 text-slate-700 font-bold rounded-lg text-sm hover:bg-slate-50 transition-colors"
                >
                  Stay in Draft
                </button>
                {successCount > 0 && (
                  <button
                    onClick={() => { setModalState('none'); setCalcComplete(false); setActiveTab('ready'); }}
                    className="flex-1 h-12 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
                  >
                    <PaperPlaneRight size={16} weight="fill" />
                    Ready to Send
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sending Progress Overlay */}
      {modalState === 'sending' && (
        <div className="absolute inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" />
          {/* Hug-content sheet — grows with content, capped at 80vh */}
          <div className="bg-white w-full rounded-t-3xl relative z-10 animate-in slide-in-from-bottom duration-300" style={{maxHeight: '80vh', overflowY: 'auto'}}>

            {/* Header: drag handle + progress info */}
            <div className="p-6 pb-4">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-5" />
              <div className="flex items-center gap-4 mb-5">
                {/* Icon: spinner when sending, checkmark when done */}
                <div className="relative w-12 h-12 shrink-0">
                  {sendComplete ? (
                    <div className="absolute inset-0 rounded-full bg-primary/10 flex items-center justify-center">
                      <CheckCircle size={24} weight="fill" className="text-primary" />
                    </div>
                  ) : (
                    <>
                      <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <PaperPlaneRight size={18} weight="fill" className="text-primary" />
                      </div>
                    </>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold text-secondary leading-tight">
                    {sendComplete ? 'Sending Complete' : 'Sending invoices\u2026'}
                  </h2>
                  {!sendComplete && (
                    <p className="text-slate-400 text-xs mt-0.5">
                      {sendProgress} of {sendTotal} invoices processed
                    </p>
                  )}
                </div>
                <span className="text-sm font-bold text-primary shrink-0">
                  {sendTotal > 0 ? Math.round((sendProgress / sendTotal) * 100) : 0}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-200 ease-out"
                  style={{ width: sendTotal > 0 ? `${(sendProgress / sendTotal) * 100}%` : '0%' }}
                />
              </div>
            </div>

            {/* Log area */}
            <div className="px-6">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Sending log</p>

              {!sendComplete ? (
                /* Live list during animation */
                <div className="overflow-y-auto" style={{maxHeight: '180px'}}>
                  <div className="flex flex-col gap-1.5 pb-2">
                    {[...sendLogs.slice(0, sendProgress)].reverse().map((entry, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg ${
                          entry.status === 'success' ? 'bg-green-50' : 'bg-red-50'
                        }`}
                      >
                        {entry.status === 'success' ? (
                          <CheckCircle size={16} weight="fill" className="text-green-500 shrink-0" />
                        ) : (
                          <WarningCircle size={16} weight="fill" className="text-red-500 shrink-0" />
                        )}
                        <span className={`text-[12px] font-bold ${
                          entry.status === 'success' ? 'text-green-700' : 'text-red-700'
                        }`}>
                          Unit {entry.unitNumber}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Accordion cards when done */
                <div className="flex flex-col gap-2 pb-2">

                  {/* Success accordion */}
                  {sendSuccessCount > 0 && (
                    <div className="rounded-lg overflow-hidden border border-green-200">
                      <button
                        onClick={() => setOpenSendAccordion(openSendAccordion === 'success' ? null : 'success')}
                        className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${
                          openSendAccordion === 'success' ? 'bg-emerald-600 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle size={18} weight="fill" className={openSendAccordion === 'success' ? 'text-white' : 'text-green-500'} />
                          <span className="text-sm font-bold">{sendSuccessCount} invoice berhasil dikirim</span>
                        </div>
                        <CaretRight
                          size={14}
                          weight="bold"
                          className={`transition-transform duration-200 ${
                            openSendAccordion === 'success' ? 'rotate-90 text-white' : 'text-green-500'
                          }`}
                        />
                      </button>
                      {openSendAccordion === 'success' && (
                        <div className="bg-white px-4 py-3 flex flex-col gap-2 overflow-y-auto" style={{maxHeight: '200px'}}>
                          {sendLogs.filter(l => l.status === 'success').map((entry, i) => (
                            <div key={i} className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-green-50">
                              <CheckCircle size={16} weight="fill" className="text-green-500 shrink-0 mt-px" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-bold text-green-700 leading-tight">Unit {entry.unitNumber}</p>
                                <RenderEntryMessages entry={entry} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Failed accordion */}
                  {sendLogs.filter(l => l.status === 'error').length > 0 && (
                    <div className="rounded-lg overflow-hidden border border-red-200">
                      <button
                        onClick={() => setOpenSendAccordion(openSendAccordion === 'failed' ? null : 'failed')}
                        className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${
                          openSendAccordion === 'failed' ? 'bg-red-500 text-white' : 'bg-red-50 text-red-600 hover:bg-red-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <WarningCircle size={18} weight="fill" className={openSendAccordion === 'failed' ? 'text-white' : 'text-red-500'} />
                          <span className="text-sm font-bold">{sendLogs.filter(l => l.status === 'error').length} invoice gagal dikirim</span>
                        </div>
                        <CaretRight
                          size={14}
                          weight="bold"
                          className={`transition-transform duration-200 ${
                            openSendAccordion === 'failed' ? 'rotate-90 text-white' : 'text-red-400'
                          }`}
                        />
                      </button>
                      {openSendAccordion === 'failed' && (
                        <div className="bg-white px-4 py-3 flex flex-col gap-2 overflow-y-auto" style={{maxHeight: '200px'}}>
                          {sendLogs.filter(l => l.status === 'error').map((entry, i) => (
                            <div key={i} className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-red-50">
                              <WarningCircle size={16} weight="fill" className="text-red-500 shrink-0 mt-px" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-bold text-red-700 leading-tight">Unit {entry.unitNumber}</p>
                                <RenderEntryMessages entry={entry} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}
            </div>

            {/* Action Buttons — only shown when sending is done */}
            {sendComplete && (
              <div className="px-6 pb-8 pt-4 flex gap-3">
                <button
                  onClick={() => { setModalState('none'); setSendComplete(false); }}
                  className="flex-1 h-12 border border-slate-300 text-slate-700 font-bold rounded-lg text-sm hover:bg-slate-50 transition-colors"
                >
                  Stay in Ready
                </button>
                <button
                  onClick={() => { setModalState('none'); setSendComplete(false); setActiveTab('sent'); }}
                  className="flex-1 h-12 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
                >
                  <PaperPlaneRight size={16} weight="fill" />
                  View Sent Invoices
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <ConfirmModal 
        isOpen={modalState === 'delete'} 
        onClose={() => setModalState('none')}
        image={deleteIllustration}
        title={
          itemToDelete === 'selected-sent'
            ? `Delete ${selectedSent.size} invoice${selectedSent.size > 1 ? 's' : ''}?`
            : itemToDelete === 'selected'
            ? `Delete ${selectedReady.size} invoice${selectedReady.size > 1 ? 's' : ''}?`
            : 'Delete this invoice?'
        }
        description={
          itemToDelete === 'selected-sent'
            ? `${selectedSent.size} selected sent invoice${selectedSent.size > 1 ? 's' : ''} will be deleted.`
            : itemToDelete === 'selected'
            ? `${selectedReady.size} selected invoice${selectedReady.size > 1 ? 's' : ''} will be deleted and must be recalculated from the Draft tab.`
            : `Invoice for unit ${itemToDelete} will be deleted.`
        }
        confirmText="Yes, delete"
        confirmStyle="danger"
        onConfirm={() => {
          if (itemToDelete === 'selected-sent') {
            setSentInvoices(prev => prev.filter(s => !selectedSent.has(s.id)));
            setSelectedSent(new Set());
          } else if (itemToDelete === 'selected') {
            setSelectedReady(new Set());
          } else if (sentToDeleteId) {
            setSentInvoices(prev => prev.filter(s => s.id !== sentToDeleteId));
            setSentToDeleteId(null);
          } else {
            setReadyInvoices(prev => prev.filter(r => r.unitNumber !== itemToDelete));
            setSentInvoices(prev => prev.filter(s => s.unitNumber !== itemToDelete));
          }
          setItemToDelete(null);
          setModalState('none');
        }}
      />
        </>
      )}



    </div>
  );
}

// --- Subcomponents ---

const RoundedCheckbox = ({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    disabled={disabled}
    onClick={onChange}
    className={`w-[18px] h-[18px] rounded-[4px] shrink-0 flex items-center justify-center transition-all duration-150 ${
      checked
        ? 'bg-primary'
        : disabled
        ? 'bg-slate-100 border-2 border-slate-200'
        : 'bg-white border-2 border-slate-200'
    } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
  >
    {checked && (
      <svg width="11" height="8" viewBox="0 0 13 10" fill="none">
        <path d="M1.5 5L5 8.5L11.5 1.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )}
  </button>
);

const UtilityStatusBadge = ({ status }: { status: UtilityStatus }) => {
  let colorClass = '';
  switch (status) {
    case 'Approved':
      colorClass = 'bg-emerald-600 text-white';
      break;
    case 'Waiting approval':
      colorClass = 'bg-amber-500 text-white';
      break;
    case 'No data':
      colorClass = 'bg-red-500 text-white';
      break;
    case 'Inactive':
      colorClass = 'bg-slate-400 text-white';
      break;
  }
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${colorClass}`}>
      {status === 'Waiting approval' ? 'Waiting Approval' : status === 'No data' ? 'No Data' : status}
    </span>
  );
};

const InvoiceStatusBadge = ({ status }: { status: SentInvoice['status'] }) => {
  let colorClass = '';
  switch (status) {
    case 'Paid':
      colorClass = 'bg-emerald-600 text-white';
      break;
    case 'Unpaid':
      colorClass = 'bg-amber-500 text-white';
      break;
    case 'Overdue':
      colorClass = 'bg-red-500 text-white';
      break;
  }
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${colorClass}`}>
      {status}
    </span>
  );
};

const getRelevantStatuses = (tab: TabType) => {
  switch (tab) {
    case 'draft': return ['Approved', 'Waiting approval', 'No data', 'Inactive'];
    case 'ready': return ['Ready to sent', 'Zero amount'];
    case 'sent': return ['Unpaid', 'Overdue', 'Paid'];
    default: return [];
  }
};

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const BottomSheet = ({ isOpen, onClose, title, children }: BottomSheetProps) => {
  if (!isOpen) return null;
  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40 transition-opacity" onClick={onClose} />
      <div className="bg-white w-full rounded-t-3xl p-6 relative z-10 animate-in slide-in-from-bottom duration-300 shadow-2xl">
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 rounded-full">
            <X size={20} weight="bold" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  icon?: React.ReactNode;
  iconBg?: string;
  image?: string;
  title: string;
  description: string;
  confirmText: string;
  confirmStyle?: 'primary' | 'danger';
}

const ConfirmModal = ({ isOpen, onClose, onConfirm, icon, iconBg, image, title, description, confirmText, confirmStyle = 'primary' }: ConfirmModalProps) => {
  if (!isOpen) return null;
  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40 transition-opacity" onClick={onClose} />
      <div className="bg-white w-full rounded-t-3xl p-6 relative z-10 animate-in slide-in-from-bottom duration-300 pb-10">
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
        <div className="flex flex-col items-center text-center gap-4">
          {image ? (
            <img src={image} alt="" className="w-full rounded-2xl object-cover" style={{height: '260px'}} />
          ) : (
            <div className={`w-14 h-14 rounded-full ${iconBg} flex items-center justify-center shrink-0`}>
              {icon}
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold mb-2">{title}</h2>
            <p className="text-slate-500 text-sm leading-relaxed max-w-[280px] mx-auto">{description}</p>
          </div>
          <div className="flex gap-3 w-full mt-4">
            <button 
              onClick={onClose}
              className="flex-1 py-3.5 border border-slate-300 text-slate-700 font-bold rounded-lg text-sm"
            >
              Cancel
            </button>
            <button 
              onClick={onConfirm}
              className={`flex-1 py-3.5 font-bold rounded-lg text-sm text-white ${
                confirmStyle === 'danger' ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary-dark'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

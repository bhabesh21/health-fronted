import React, { useEffect, useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import LinearProgress from "@mui/material/LinearProgress";
import Select from "@mui/material/Select";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PaymentsIcon from "@mui/icons-material/Payments";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CircularProgress from "@mui/material/CircularProgress";
import { alpha, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import api from "../api/api-handler";

const statusOptions = ["Paid", "Unpaid", "Partial"];
const itemTypeOptions = [
  "Consultation",
  "Room Rent",
  "Medicine",
  "X-ray",
  "Tests",
  "Other",
];

const toDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateInput = (value) => {
  const date = toDate(value);
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDate = (value) => {
  const date = toDate(value);
  return date ? date.toLocaleDateString("en-IN") : "-";
};

const formatDateTime = (value) => {
  const date = toDate(value);
  return date
    ? date.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "-";
};

const formatMoney = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const unwrapRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.invoices)) return payload.invoices;
  return [];
};
const getStatus = (invoice) =>
  invoice?.status || invoice?.paymentStatus || "Unpaid";

const getDue = (invoice) =>
  Math.max(
    0,
    Number(invoice?.totalAmount || 0) - Number(invoice?.paidAmount || 0),
  );

const getAppointmentDate = (appointment) =>
  appointment?.appointmentDate || appointment?.date || null;

const formatAppointmentSlot = (appointment) => {
  const date = getAppointmentDate(appointment);
  const time = appointment?.time ? String(appointment.time) : "";
  const dateLabel = date ? formatDate(date) : "-";
  return time ? `${dateLabel} ${time}` : dateLabel;
};

const getAppointmentPatientName = (appointment) =>
  appointment?.patient?.name || appointment?.patientName || "-";

const getAppointmentDoctorName = (appointment) =>
  appointment?.doctor?.name || appointment?.doctorName || "-";

const getInvoicePatientName = (invoice) =>
  invoice?.patientId?.name ||
  invoice?.patient?.name ||
  invoice?.appointmentId?.patient?.name ||
  invoice?.patientName ||
  "-";

const getInvoiceDoctorName = (invoice) =>
  invoice?.doctorId?.name ||
  invoice?.doctor?.name ||
  invoice?.appointmentId?.doctor?.name ||
  invoice?.doctorName ||
  "-";

const createEmptyInvoiceForm = () => ({
  _id: null,
  appointmentId: "",
  patientId: "",
  doctorId: "",
  patientName: "",
  doctorName: "",
  invoiceDate: formatDateInput(new Date()),
  gstPercent: 0,
  discountAmount: 0,
  paidAmount: 0,
  items: [
    {
      type: "Consultation",
      description: "Consultation",
      qty: 1,
      price: 0,
    },
  ],
});

export default function Billing() {
  const STRIPE_PUBLISHABLE_KEY =
    import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [invoices, setInvoices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selected, setSelected] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState(createEmptyInvoiceForm);
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const disablePatientDoctorFields =
    !invoiceForm._id && !invoiceForm.appointmentId;

  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
  };

  const invoiceCalc = useMemo(() => {
    const items = invoiceForm.items || [];
    const subtotal = items.reduce((sum, item) => {
      const qty = Math.max(0, Number(item.qty || 0));
      const price = Math.max(0, Number(item.price || 0));
      return sum + qty * price;
    }, 0);

    const gstPercent = Math.max(0, Number(invoiceForm.gstPercent || 0));
    const discountAmount = Math.max(0, Number(invoiceForm.discountAmount || 0));
    const gstAmount = (subtotal * gstPercent) / 100;
    const total = Math.max(0, subtotal + gstAmount - discountAmount);
    const paid = Math.max(0, Number(invoiceForm.paidAmount || 0));
    const due = Math.max(0, total - paid);

    return { subtotal, gstAmount, total, paid, due };
  }, [invoiceForm]);

  const getStatusChip = (status) => {
    const value = status || "Unpaid";
    const color =
      value === "Paid" ? "success" : value === "Partial" ? "info" : "warning";
    return <Chip size="small" label={value} color={color} variant="filled" />;
  };

  const fetchInvoices = async () => {
    try {
      const res = await api.get("/admin/invoices/getAll");
      setInvoices(unwrapRows(res.data));
    } catch (error) {
      console.error("Failed to fetch invoices", error);
      showToast(getErrorMessage(error, "Failed to fetch invoices."), "error");
    }
  };

  const fetchAppointments = async () => {
    try {
      const res = await api.get("/admin/appointments/getAll");
      setAppointments(unwrapRows(res.data));
    } catch (error) {
      console.error("Failed to fetch appointments", error);
      showToast(
        getErrorMessage(error, "Failed to load appointments."),
        "error",
      );
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchAppointments();
  }, []);

  const availableAppointments = useMemo(
    () => (appointments || []).filter((appointment) => !appointment.invoiceId),
    [appointments],
  );

  const filteredInvoices = useMemo(() => {
    const q = String(searchText || "")
      .trim()
      .toLowerCase();

    return (invoices || []).filter((invoice) => {
      const matchesStatus =
        statusFilter === "All" ||
        String(getStatus(invoice)) === String(statusFilter);
      const matchesText =
        !q ||
        getInvoicePatientName(invoice).toLowerCase().includes(q) ||
        getInvoiceDoctorName(invoice).toLowerCase().includes(q) ||
        String(invoice.invoiceNumber || "")
          .toLowerCase()
          .includes(q);

      return matchesStatus && matchesText;
    });
  }, [invoices, searchText, statusFilter]);

  const billingSummary = useMemo(() => {
    const totalInvoices = invoices.length;
    const paidInvoices = invoices.filter(
      (invoice) => getStatus(invoice) === "Paid",
    ).length;
    const partialInvoices = invoices.filter(
      (invoice) => getStatus(invoice) === "Partial",
    ).length;
    const unpaidInvoices = invoices.filter(
      (invoice) => getStatus(invoice) === "Unpaid",
    ).length;
    const totalBilled = invoices.reduce(
      (sum, invoice) => sum + Number(invoice.totalAmount || 0),
      0,
    );
    const totalCollected = invoices.reduce(
      (sum, invoice) => sum + Number(invoice.paidAmount || 0),
      0,
    );
    const totalDue = invoices.reduce(
      (sum, invoice) => sum + getDue(invoice),
      0,
    );
    const averageTicket = totalInvoices ? totalBilled / totalInvoices : 0;
    const collectionRate = totalBilled
      ? Math.round((totalCollected / totalBilled) * 100)
      : 0;
    const readyAppointments = availableAppointments.length;
    const backlogRate = totalInvoices
      ? Math.round(((unpaidInvoices + partialInvoices) / totalInvoices) * 100)
      : 0;

    return {
      totalInvoices,
      paidInvoices,
      partialInvoices,
      unpaidInvoices,
      totalBilled,
      totalCollected,
      totalDue,
      averageTicket,
      collectionRate,
      readyAppointments,
      backlogRate,
    };
  }, [availableAppointments.length, invoices]);

  const hasFilters =
    Boolean(String(searchText || "").trim()) || statusFilter !== "All";

  const clearFilters = () => {
    setSearchText("");
    setStatusFilter("All");
  };

  const heroChipSx = {
    borderRadius: 999,
    fontWeight: 700,
    color: "#fff",
    bgcolor: alpha("#fff", 0.12),
    border: `1px solid ${alpha("#fff", 0.2)}`,
    backdropFilter: "blur(8px)",
    "& .MuiChip-label": { px: 0.75 },
  };

  const heroButtonSx = {
    borderRadius: 999,
    px: 2.5,
    py: 1.2,
    textTransform: "none",
    fontWeight: 800,
    boxShadow: "none",
    bgcolor: "#fff",
    color: theme.palette.primary.dark,
    "&:hover": {
      boxShadow: "none",
      bgcolor: alpha("#fff", 0.92),
    },
  };

  const heroOutlineSx = {
    borderRadius: 999,
    px: 2.5,
    py: 1.2,
    textTransform: "none",
    fontWeight: 800,
    color: "#fff",
    borderColor: alpha("#fff", 0.35),
    "&:hover": {
      borderColor: "#fff",
      bgcolor: alpha("#fff", 0.08),
    },
  };

  const surfaceSx = {
    borderRadius: 4,
    border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
    bgcolor: alpha(theme.palette.background.paper, 0.92),
    backdropFilter: "blur(12px)",
    boxShadow: "0 18px 42px rgba(15, 23, 42, 0.08)",
  };

  const tableShellSx = {
    ...surfaceSx,
    p: { xs: 1.5, md: 2 },
    overflow: "hidden",
  };

  const handleView = (invoice) => {
    setSelected(invoice);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelected(null);
  };

  const openCreate = () => {
    setInvoiceForm(createEmptyInvoiceForm());
    setShowEditor(true);
  };

  const openEdit = (invoice) => {
    setInvoiceForm({
      _id: invoice._id,
      appointmentId: invoice.appointmentId?._id || invoice.appointmentId || "",
      patientId: invoice.patientId?._id || invoice.patientId || "",
      doctorId: invoice.doctorId?._id || invoice.doctorId || "",
      patientName: getInvoicePatientName(invoice),
      doctorName: getInvoiceDoctorName(invoice),
      invoiceDate: invoice.invoiceDate
        ? formatDateInput(invoice.invoiceDate)
        : "",
      gstPercent: invoice.gstPercent ?? 0,
      discountAmount: invoice.discountAmount ?? 0,
      paidAmount: invoice.paidAmount ?? 0,
      items:
        (invoice.items || []).length > 0
          ? invoice.items.map((item) => ({
              type: item.type || "Other",
              description: item.description || "",
              qty: item.qty ?? 1,
              price: item.price ?? 0,
            }))
          : createEmptyInvoiceForm().items,
    });
    setShowEditor(true);
  };

  const closeEditor = () => {
    if (isSaving) return;
    setShowEditor(false);
    setInvoiceForm(createEmptyInvoiceForm());
  };

  const handleEditorChange = (event) => {
    const { name, value } = event.target;
    setInvoiceForm((form) => ({ ...form, [name]: value }));
  };

  const handleAppointmentChange = (event) => {
    const appointmentId = event.target.value;
    const appointment = availableAppointments.find(
      (item) => String(item._id) === String(appointmentId),
    );

    setInvoiceForm((form) => ({
      ...form,
      appointmentId,
      patientId: appointment?.patient?._id || appointment?.patient || "",
      doctorId: appointment?.doctor?._id || appointment?.doctor || "",
      patientName:
        appointment?.patient?.name ||
        appointment?.patientName ||
        form.patientName,
      doctorName:
        appointment?.doctor?.name || appointment?.doctorName || form.doctorName,
      invoiceDate: appointment?.date
        ? formatDateInput(appointment.date)
        : form.invoiceDate,
      items: [
        {
          type: "Consultation",
          description: "Consultation",
          qty: 1,
          price: Number(appointment?.doctor?.fees || 0) || 0,
        },
      ],
    }));
  };

  const updateItem = (index, key, value) => {
    setInvoiceForm((form) => {
      const items = [...(form.items || [])];
      items[index] = { ...items[index], [key]: value };
      return { ...form, items };
    });
  };

  const addItem = () => {
    setInvoiceForm((form) => ({
      ...form,
      items: [
        ...(form.items || []),
        { type: "Other", description: "", qty: 1, price: 0 },
      ],
    }));
  };

  const removeItem = (index) => {
    setInvoiceForm((form) => {
      const items = [...(form.items || [])];
      items.splice(index, 1);
      return {
        ...form,
        items: items.length
          ? items
          : [
              {
                type: "Consultation",
                description: "Consultation",
                qty: 1,
                price: 0,
              },
            ],
      };
    });
  };

  const normalizeItemsForSave = () => {
    const items = (invoiceForm.items || [])
      .map((item) => ({
        type: item.type || "Other",
        description: String(item.description || "").trim(),
        qty: Number(item.qty || 0),
        price: Number(item.price || 0),
      }))
      .filter((item) => item.description !== "");

    for (const item of items) {
      if (item.qty <= 0 || item.price < 0) {
        return { error: "Quantity must be >= 1 and price must be >= 0." };
      }
    }

    return { items };
  };

  const saveInvoice = async (event) => {
    event.preventDefault();

    if (!invoiceForm._id && !invoiceForm.appointmentId) {
      showToast("Please select an appointment.", "error");
      return;
    }

    if (!invoiceForm.patientName || !invoiceForm.doctorName) {
      showToast("Patient/Doctor missing.", "error");
      return;
    }

    const { items, error } = normalizeItemsForSave();
    if (error) {
      showToast(error, "error");
      return;
    }
    if (!items || items.length === 0) {
      showToast("Please add at least one item.", "error");
      return;
    }

    const gstPercent = Number(invoiceForm.gstPercent || 0);
    const discountAmount = Number(invoiceForm.discountAmount || 0);
    const paidAmount = Number(invoiceForm.paidAmount || 0);

    if (gstPercent < 0 || discountAmount < 0 || paidAmount < 0) {
      showToast("GST/Discount/Paid Amount cannot be negative.", "error");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        appointmentId: invoiceForm.appointmentId || undefined,
        patientId: invoiceForm.patientId || undefined,
        doctorId: invoiceForm.doctorId || undefined,
        patientName: invoiceForm.patientName,
        doctorName: invoiceForm.doctorName,
        invoiceDate: invoiceForm.invoiceDate
          ? new Date(`${invoiceForm.invoiceDate}T00:00:00`).toISOString()
          : undefined,
        items,
        gstPercent,
        discountAmount,
        paidAmount,
      };

      const response = invoiceForm._id
        ? await api.put(`/admin/invoices/update/${invoiceForm._id}`, payload)
        : await api.post("/admin/invoices/create", payload);
      const saved = response.data;

      setInvoices((list) => {
        const exists = list.some((item) => item._id === saved._id);
        if (exists) {
          return list.map((item) => (item._id === saved._id ? saved : item));
        }
        return [saved, ...list];
      });

      await fetchAppointments();
      showToast(
        invoiceForm._id ? "Invoice updated." : "Invoice created.",
        "success",
      );
      closeEditor();
    } catch (error) {
      console.error("Failed to save invoice", error);
      showToast(getErrorMessage(error, "Failed to save invoice."), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const setPaidAmount = async (invoice, paidAmount) => {
    try {
      const response = await api.patch(`/admin/invoices/${invoice._id}/payment`, {
        paidAmount,
      });
      showToast("Payment updated.", "success");
      setInvoices((list) =>
        list.map((item) => (item._id === invoice._id ? response.data : item)),
      );
      if (selected?._id === invoice._id) {
        setSelected(response.data);
      }
    } catch (error) {
      console.error("Failed to update payment", error);
      showToast(getErrorMessage(error, "Failed to update payment."), "error");
    }
  };

  const markPaidToggle = async (invoice) => {
    if (getStatus(invoice) === "Paid") {
      showToast(
        "Invoice already paid. Duplicate payments are not allowed.",
        "warning",
      );
      return;
    }

    await setPaidAmount(invoice, Number(invoice.totalAmount || 0));
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/invoices/delete/${id}`);
      setInvoices((list) => list.filter((item) => item._id !== id));
      await fetchAppointments();
      if (selected?._id === id) {
        handleCloseDetails();
      }
      showToast("Invoice deleted.", "success");
    } catch (error) {
      console.error("Failed to delete invoice", error);
      showToast(getErrorMessage(error, "Failed to delete invoice."), "error");
    }
  };

  const downloadAsPdf = (invoice) => {
    const patientName = getInvoicePatientName(invoice);
    const doctorName = getInvoiceDoctorName(invoice);
    const appointmentSlot = formatAppointmentSlot(invoice?.appointmentId);

    const rows = (invoice.items || [])
      .map(
        (item) => `
          <tr>
            <td>${item.type || ""}</td>
            <td>${item.description || ""}</td>
            <td style="text-align:right">${item.qty ?? 1}</td>
            <td style="text-align:right">${Number(item.price || 0).toFixed(2)}</td>
            <td style="text-align:right">${(
              Number(item.qty || 0) * Number(item.price || 0)
            ).toFixed(2)}</td>
          </tr>
        `,
      )
      .join("\n");

    const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${invoice.invoiceNumber || "Invoice"}</title>
  <style>
    body{font-family:Arial,sans-serif;padding:24px;color:#111;}
    h1{margin:0 0 8px 0;font-size:20px;}
    .meta{margin:0 0 16px 0;font-size:12px;color:#333;line-height:1.6;}
    table{width:100%;border-collapse:collapse;margin-top:12px;}
    th,td{border:1px solid #ddd;padding:8px;font-size:12px;}
    th{background:#f5f5f5;text-align:left;}
    .totals{margin-top:12px;width:320px;margin-left:auto;}
    .totals td{border:none;padding:4px 0;}
    .right{text-align:right;}
    @media print{button{display:none;}}
  </style>
</head>
<body>
  <h1>Hospital Invoice</h1>
  <div class="meta">
    <div><b>Invoice No:</b> ${invoice.invoiceNumber || "-"}</div>
    <div><b>Invoice Date:</b> ${formatDateTime(invoice.invoiceDate)}</div>
    <div><b>Patient:</b> ${patientName}</div>
    <div><b>Doctor:</b> ${doctorName}</div>
    <div><b>Appointment:</b> ${appointmentSlot}</div>
    <div><b>Status:</b> ${getStatus(invoice)}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Type</th>
        <th>Description</th>
        <th class="right">Qty</th>
        <th class="right">Price</th>
        <th class="right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${
        rows ||
        "<tr><td colspan='5' style='text-align:center'>No items</td></tr>"
      }
    </tbody>
  </table>

  <table class="totals">
    <tr><td>Subtotal</td><td class="right">${Number(invoice.subtotalAmount || 0).toFixed(2)}</td></tr>
    <tr><td>GST (${Number(invoice.gstPercent || 0).toFixed(2)}%)</td><td class="right">${Number(invoice.gstAmount || 0).toFixed(2)}</td></tr>
    <tr><td>Discount</td><td class="right">${Number(invoice.discountAmount || 0).toFixed(2)}</td></tr>
    <tr><td><b>Total</b></td><td class="right"><b>${Number(invoice.totalAmount || 0).toFixed(2)}</b></td></tr>
    <tr><td>Paid</td><td class="right">${Number(invoice.paidAmount || 0).toFixed(2)}</td></tr>
  </table>
</body>
</html>`;

    try {
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      iframe.setAttribute("aria-hidden", "true");
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (!doc) throw new Error("iframe document not available");

      doc.open();
      doc.write(html);
      doc.close();

      const cleanup = () => {
        try {
          iframe.remove();
        } catch {
          // ignore
        }
      };

      const doPrint = () => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } finally {
          setTimeout(cleanup, 1000);
        }
      };

      if (iframe.contentWindow) {
        iframe.contentWindow.onafterprint = cleanup;
      }
      setTimeout(doPrint, 100);
    } catch (error) {
      console.error("PDF print failed", error);
      showToast(
        "PDF export blocked by the browser. Allow popups/print and try again.",
        "error",
      );
    }
  };

  return (
    <Box
      sx={{
        position: "relative",
        minHeight: "100%",
        px: { xs: 1.5, md: 2.5 },
        py: { xs: 2, md: 3 },
        overflow: "hidden",
        background: `radial-gradient(circle at top left, ${alpha(theme.palette.primary.main, 0.12)} 0, transparent 32%), radial-gradient(circle at top right, ${alpha(theme.palette.info.main, 0.12)} 0, transparent 28%), linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, #f8fafc 22%, #ffffff 56%, ${alpha(theme.palette.secondary.main, 0.04)} 100%)`,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: "-7% auto auto -8%",
          width: 260,
          height: 260,
          borderRadius: "50%",
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          filter: "blur(26px)",
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          right: "-6%",
          bottom: "-10%",
          width: 340,
          height: 340,
          borderRadius: "50%",
          bgcolor: alpha(theme.palette.info.main, 0.08),
          filter: "blur(36px)",
          pointerEvents: "none",
        }}
      />

      <Stack spacing={3} sx={{ position: "relative", zIndex: 1 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} xl={3}>
            <BillingStatCard
              title="Total invoices"
              value={billingSummary.totalInvoices}
              note={`Paid ${billingSummary.paidInvoices} | Partial ${billingSummary.partialInvoices}`}
              icon={<ReceiptLongIcon />}
              accent={theme.palette.primary.main}
            />
          </Grid>
          <Grid item xs={12} sm={6} xl={3}>
            <BillingStatCard
              title="Collected"
              value={formatMoney(billingSummary.totalCollected)}
              note={`${billingSummary.collectionRate}% of billed amount collected`}
              icon={<PaymentsIcon />}
              accent={theme.palette.success.main}
            />
          </Grid>
          <Grid item xs={12} sm={6} xl={3}>
            <BillingStatCard
              title="Outstanding"
              value={formatMoney(billingSummary.totalDue)}
              note={`Open balance across ${billingSummary.unpaidInvoices} invoices`}
              icon={<PendingActionsIcon />}
              accent={theme.palette.warning.main}
            />
          </Grid>
          <Grid item xs={12} sm={6} xl={3}>
            <BillingStatCard
              title="Ready to invoice"
              value={billingSummary.readyAppointments}
              note="Appointments waiting for billing"
              icon={<EventAvailableIcon />}
              accent={theme.palette.info.main}
            />
          </Grid>
        </Grid>
     
<Stack spacing={3} sx={{ position: "relative", zIndex: 1 }}>
  {/* Search + Filter + Create */}
  <Paper
    elevation={0}
    sx={{
      p: 3,
      borderRadius: 4,
      border: "1px solid #e5e7eb",
      background: "#fff",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 2,
    }}
  >
    <Stack direction="row" spacing={2} flexWrap="wrap">
      <TextField
        size="small"
        placeholder="Search invoice / patient / doctor"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        sx={{
          minWidth: 260,
          "& .MuiOutlinedInput-root": {
            borderRadius: 3,
          },
        }}
      />

      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel>Status</InputLabel>

        <Select
          value={statusFilter}
          label="Status"
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ borderRadius: 3 }}
        >
          <MenuItem value="All">All</MenuItem>

          {statusOptions.map((s) => (
            <MenuItem key={s} value={s}>
              {s}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>

    <Button
      variant="contained"
      startIcon={<AddIcon />}
      onClick={openCreate}
      sx={{
        borderRadius: 999,
        px: 3,
        py: 1.2,
        fontWeight: 700,
        textTransform: "none",
        boxShadow: "none",
      }}
    >
      Create Invoice
    </Button>
  </Paper>

  {/* Table */}
  <Paper
    elevation={0}
    sx={{
      borderRadius: 4,
      overflow: "hidden",
      border: "1px solid #e5e7eb",
    }}
  >
    {filteredInvoices.length > 0 ? (
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow
              sx={{
                background:
                  "linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)",
              }}
            >
              {[
                "Invoice",
                "Patient",
                "Doctor",
                "Appointment",
                "Invoice Date",
                "Status",
                "Amount",
                "Action",
              ].map((head) => (
                <TableCell
                  key={head}
                  sx={{
                    color: "#fff",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    borderBottom: "none",
                  }}
                  align={head === "Action" ? "right" : "left"}
                >
                  {head}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredInvoices.map((invoice) => (
              <TableRow
                key={invoice._id}
                hover
                sx={{
                  transition: "0.3s",
                  "&:hover": {
                    backgroundColor: "#f5f9ff",
                  },
                }}
              >
                <TableCell sx={{ fontWeight: 700 }}>
                  {invoice.invoiceNumber || "-"}
                </TableCell>

                <TableCell>
                  {getInvoicePatientName(invoice)}
                </TableCell>

                <TableCell>
                  {getInvoiceDoctorName(invoice)}
                </TableCell>

                <TableCell>
                  {formatAppointmentSlot(invoice?.appointmentId)}
                </TableCell>

                <TableCell>
                  {formatDateTime(invoice.invoiceDate)}
                </TableCell>

                <TableCell>
                  {getStatusChip(getStatus(invoice))}
                </TableCell>

                <TableCell sx={{ fontWeight: 700 }}>
                  {formatMoney(invoice.totalAmount)}
                </TableCell>

                <TableCell align="right">
                  <Stack
                    direction="row"
                    spacing={1}
                    justifyContent="flex-end"
                    flexWrap="wrap"
                  >
                    <IconButton
                      onClick={() => handleView(invoice)}
                      size="small"
                      sx={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 2,
                      }}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>

                    <IconButton
                      onClick={() => downloadAsPdf(invoice)}
                      size="small"
                      sx={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 2,
                      }}
                    >
                      <PictureAsPdfIcon fontSize="small" />
                    </IconButton>

                    <IconButton
                      onClick={() => openEdit(invoice)}
                      size="small"
                      sx={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 2,
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>


                    <IconButton
                      onClick={() => handleDelete(invoice._id)}
                      size="small"
                      color="error"
                      sx={{
                        border: "1px solid #fecaca",
                        borderRadius: 2,
                        bgcolor: "#fef2f2",
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    ) : (
      <Box
        sx={{
          py: 10,
          textAlign: "center",
        }}
      >
        <Avatar
          sx={{
            width: 80,
            height: 80,
            mx: "auto",
            mb: 2,
            bgcolor: "#e3f2fd",
            color: "#1976d2",
          }}
        >
          <ReceiptLongIcon sx={{ fontSize: 40 }} />
        </Avatar>

        <Typography variant="h6" fontWeight={700}>
          No invoices found
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 1 }}
        >
          Create your first invoice to start tracking payments.
        </Typography>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
          sx={{
            mt: 3,
            borderRadius: 999,
            textTransform: "none",
            fontWeight: 700,
            boxShadow: "none",
          }}
        >
          Create Invoice
        </Button>
      </Box>
    )}
  </Paper>
</Stack>

        <Dialog
          open={showEditor}
          onClose={closeEditor}
          scroll="paper"
          fullScreen={isMobile}
          fullWidth
          maxWidth="lg"
          PaperProps={{
            sx: {
              borderRadius: isMobile ? 0 : 4,
              display: "flex",
              flexDirection: "column",
              maxHeight: isMobile ? "100vh" : "calc(100vh - 48px)",
              overflow: "hidden",
            },
          }}
        >
          <Box
            component="form"
            onSubmit={saveInvoice}
            sx={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              minHeight: 0,
            }}
          >
            <DialogTitle

            maxWidth="lg" fullWidth
              sx={{
                pb: 2,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.info.main, 0.06)} )`, 
              }}
            >
              <Stack
                direction="row"
                alignItems="flex-start"
                justifyContent="space-between"
                spacing={2}
              >
                <Box>
                  <Typography
                    variant="overline"
                    
                  >
                    Invoice Editor
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 900, lineHeight: 1.1 }}
                  >
                    {invoiceForm._id ? "Update invoice" : "Create invoice"}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    Connect the appointment, then fine-tune the bill before
                    saving.
                  </Typography>
                </Box>
                <Chip
                  label={invoiceForm._id ? "Editing" : "New"}
                  color="primary"
                  variant="filled"
                  size="small"
                  sx={{ fontWeight: 800 }}
                />
              </Stack>
            </DialogTitle>
            <DialogContent
              dividers
              sx={{
                bgcolor: alpha(theme.palette.background.default, 0.5),
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
              }}
            >
              <Stack spacing={2} sx={{ pt: 1 }}>
                {!invoiceForm._id && (
                  <FormControl fullWidth required size="small">
                    <InputLabel id="invoice-appointment-label">
                      Appointment
                    </InputLabel>
                    <Select
                      labelId="invoice-appointment-label"
                      label="Appointment"
                      value={invoiceForm.appointmentId}
                      onChange={handleAppointmentChange}
                    >
                      <MenuItem value="" disabled>
                        Select appointment
                      </MenuItem>
                      {availableAppointments.map((appointment) => (
                        <MenuItem key={appointment._id} value={appointment._id}>
                          {getAppointmentPatientName(appointment)} -{" "}
                          {getAppointmentDoctorName(appointment)} (
                          {formatAppointmentSlot(appointment)})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    label="Patient"
                    name="patientName"
                    size="small"
                    value={invoiceForm.patientName}
                    onChange={handleEditorChange}
                    fullWidth
                    required
                    disabled={disablePatientDoctorFields}
                  />
                  <TextField
                    label="Doctor"
                    name="doctorName"
                    size="small"
                    value={invoiceForm.doctorName}
                    onChange={handleEditorChange}
                    fullWidth
                    required
                    disabled={disablePatientDoctorFields}
                  />
                </Stack>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    label="Invoice Date"
                    name="invoiceDate"
                    type="date"
                    size="small"
                    value={invoiceForm.invoiceDate}
                    onChange={handleEditorChange}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    label="GST %"
                    name="gstPercent"
                    type="number"
                    size="small"
                    value={invoiceForm.gstPercent}
                    onChange={handleEditorChange}
                    fullWidth
                    inputProps={{ min: 0, step: "0.01" }}
                  />
                  <TextField
                    label="Discount"
                    name="discountAmount"
                    type="number"
                    size="small"
                    value={invoiceForm.discountAmount}
                    onChange={handleEditorChange}
                    fullWidth
                    inputProps={{ min: 0, step: "0.01" }}
                  />
                </Stack>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    label="Paid Amount"
                    name="paidAmount"
                    type="number"
                    size="small"
                    value={invoiceForm.paidAmount}
                    onChange={handleEditorChange}
                    fullWidth
                    inputProps={{ min: 0, step: "0.01" }}
                  />
                  <TextField
                    label="Due"
                    size="small"
                    value={formatMoney(invoiceCalc.due)}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                  <TextField
                    label="Total"
                    size="small"
                    value={formatMoney(invoiceCalc.total)}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                </Stack>

                <Box
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    bgcolor: "#fff",
                    border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      Items
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={addItem}
                      sx={{
                        textTransform: "none",
                        fontWeight: 800,
                        borderRadius: 999,
                      }}
                    >
                      Add Item
                    </Button>
                  </Stack>
                  <TableContainer
                    sx={{ maxHeight: { xs: 300, sm: 360 }, overflowY: "auto" }}
                  >
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ width: 150, fontWeight: 800 }}>
                            Type
                          </TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>
                            Description
                          </TableCell>
                          <TableCell sx={{ width: 100, fontWeight: 800 }}>
                            Qty
                          </TableCell>
                          <TableCell sx={{ width: 140, fontWeight: 800 }}>
                            Price
                          </TableCell>
                          <TableCell sx={{ width: 60 }} />
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(invoiceForm.items || []).map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <FormControl fullWidth size="small">
                                <Select
                                  value={item.type || "Other"}
                                  onChange={(event) =>
                                    updateItem(
                                      index,
                                      "type",
                                      event.target.value,
                                    )
                                  }
                                >
                                  {itemTypeOptions.map((option) => (
                                    <MenuItem key={option} value={option}>
                                      {option}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                value={item.description}
                                onChange={(event) =>
                                  updateItem(
                                    index,
                                    "description",
                                    event.target.value,
                                  )
                                }
                                fullWidth
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                type="number"
                                inputProps={{ min: 1 }}
                                value={item.qty}
                                onChange={(event) =>
                                  updateItem(index, "qty", event.target.value)
                                }
                                fullWidth
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                type="number"
                                inputProps={{ min: 0, step: "0.01" }}
                                value={item.price}
                                onChange={(event) =>
                                  updateItem(index, "price", event.target.value)
                                }
                                fullWidth
                              />
                            </TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => removeItem(index)}
                                aria-label="remove"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}

                        <TableRow>
                          <TableCell colSpan={3} />
                          <TableCell>
                            <Typography variant="subtitle2">
                              Subtotal
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="subtitle2">
                              {formatMoney(invoiceCalc.subtotal)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={3} />
                          <TableCell>
                            <Typography variant="subtitle2">GST</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="subtitle2">
                              {formatMoney(invoiceCalc.gstAmount)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={3} />
                          <TableCell>
                            <Typography variant="subtitle2">Total</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="subtitle2">
                              {formatMoney(invoiceCalc.total)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions
              sx={{
                px: 3,
                py: 2,
                bgcolor: "#fff",
                borderTop: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                position: "sticky",
                bottom: 0,
                zIndex: 1,
              }}
            >
              <Button
                onClick={closeEditor}
                disabled={isSaving}
                variant="outlined"
                sx={{ textTransform: "none", fontWeight: 800 }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isSaving}
               
              >
                {isSaving ? "Saving..." : invoiceForm._id ? "Update" : "Create"}
              </Button>
            </DialogActions>
          </Box>
        </Dialog>

        <Dialog
          open={showDetails}
          onClose={handleCloseDetails}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: {
              borderRadius: 4,
              overflow: "hidden",
            },
          }}
        >
          <DialogTitle
            sx={{
              pb: 2,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.success.main, 0.06)} 100%)`,
            }}
          >
            <Stack
              direction="row"
              alignItems="flex-start"
              justifyContent="space-between"
              spacing={2}
            >
              <Box>
                <Typography
                  variant="overline"
                  sx={{
                    color: "text.secondary",
                    fontWeight: 800,
                    letterSpacing: 1.2,
                  }}
                >
                  Invoice Details
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 900, lineHeight: 1.1 }}
                >
                  {selected?.invoiceNumber || "Invoice preview"}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  Quick summary, item breakdown, and payment actions.
                </Typography>
              </Box>
              {selected ? getStatusChip(getStatus(selected)) : null}
            </Stack>
          </DialogTitle>
          <DialogContent
            dividers
            sx={{ bgcolor: alpha(theme.palette.background.default, 0.5) }}
          >
            {!selected ? (
              <Typography variant="body2" color="text.secondary">
                No invoice selected.
              </Typography>
            ) : (
              <Stack spacing={1.25}>
                <Typography variant="body2">
                  <b>Patient:</b> {getInvoicePatientName(selected)}
                </Typography>
                <Typography variant="body2">
                  <b>Doctor:</b> {getInvoiceDoctorName(selected)}
                </Typography>
                <Typography variant="body2">
                  <b>Appointment:</b>{" "}
                  {formatAppointmentSlot(selected?.appointmentId)}
                </Typography>
                <Typography variant="body2">
                  <b>Invoice Date:</b> {formatDateTime(selected.invoiceDate)}
                </Typography>
                <Typography variant="body2">
                  <b>Status:</b> {getStatus(selected)}
                </Typography>
                <Typography variant="body2">
                  <b>Total:</b> {formatMoney(selected.totalAmount)}
                </Typography>
                <Typography variant="body2">
                  <b>Paid:</b> {formatMoney(selected.paidAmount)}
                </Typography>
                <Typography variant="body2">
                  <b>Due:</b> {formatMoney(getDue(selected))}
                </Typography>

                <Box
                  sx={{
                    mt: 1,
                    p: 2,
                    borderRadius: 3,
                    bgcolor: "#fff",
                    border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ mb: 1, fontWeight: 800 }}
                  >
                    Items
                  </Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800 }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>
                          Description
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Qty</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Price</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(selected.items || []).map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.type || "-"}</TableCell>
                          <TableCell>{item.description}</TableCell>
                          <TableCell>{item.qty ?? 1}</TableCell>
                          <TableCell>{formatMoney(item.price)}</TableCell>
                        </TableRow>
                      ))}
                      {(selected.items || []).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            <Typography variant="body2" color="text.secondary">
                              No items
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Box>
              </Stack>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, bgcolor: "#fff", gap: 1 }}>
            {selected &&
              STRIPE_PUBLISHABLE_KEY &&
              getStatus(selected) !== "Paid" &&
              getDue(selected) > 0 && (
                <Button
                  variant="contained"
                  onClick={() => setShowPay(true)}
                  sx={{
                    borderRadius: 999,
                    textTransform: "none",
                    fontWeight: 800,
                    boxShadow: "none",
                  }}
                >
                  Pay (Stripe)
                </Button>
              )}
            {selected && (
              <Button
                variant="contained"
                onClick={() => markPaidToggle(selected)}
                disabled={getStatus(selected) === "Paid"}
                sx={{
                  borderRadius: 999,
                  textTransform: "none",
                  fontWeight: 800,
                  boxShadow: "none",
                }}
              >
                {getStatus(selected) === "Paid" ? "Paid" : "Mark Paid"}
              </Button>
            )}
            {selected && (
              <Button
                variant="outlined"
                onClick={() => downloadAsPdf(selected)}
                sx={{
                  borderRadius: 999,
                  textTransform: "none",
                  fontWeight: 800,
                }}
              >
                Download PDF
              </Button>
            )}
            <Button
              onClick={handleCloseDetails}
              sx={{ textTransform: "none", fontWeight: 800 }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        <PayInvoiceDialog
          open={showPay}
          onClose={() => setShowPay(false)}
          invoice={selected}
          publishableKey={STRIPE_PUBLISHABLE_KEY}
          showToast={showToast}
          onPaid={async (invoiceId) => {
            const invoice =
              invoices.find((item) => item._id === invoiceId) || selected;
            if (invoice) {
              await setPaidAmount(invoice, Number(invoice.totalAmount || 0));
            }
            await fetchInvoices();
          }}
        />

        <Snackbar
          open={toast.open}
          autoHideDuration={3000}
          onClose={() => setToast((value) => ({ ...value, open: false }))}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          sx={{ mt: 2 }}
        >
          <Alert
            onClose={() => setToast((value) => ({ ...value, open: false }))}
            severity={toast.severity}
            variant="filled"
            sx={{ width: "100%" }}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      </Stack>
    </Box>
  );
}

function PayInvoiceDialog({
  open,
  onClose,
  invoice,
  publishableKey,
  showToast,
  onPaid,
}) {
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const status = invoice?.status || invoice?.paymentStatus || "Unpaid";
  const due = getDue(invoice);

  const stripePromise = useMemo(
    () => (publishableKey ? loadStripe(publishableKey) : null),
    [publishableKey],
  );

  useEffect(() => {
    if (!open || !invoice?._id || !publishableKey) return;

    if (status === "Paid" || due <= 0) {
      setIsLoading(false);
      setClientSecret("");
      return;
    }

    let active = true;
    setIsLoading(true);
    setClientSecret("");

    api
      .post("/payments/create-intent", { invoiceId: invoice._id })
      .then((response) => {
        if (!active) return;
        setClientSecret(response.data?.clientSecret || "");
      })
      .catch((error) => {
        console.error("Failed to create payment intent", error);
        if (active) setClientSecret("");
        showToast?.(
          getErrorMessage(error, "Failed to start payment."),
          "error",
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, invoice?._id, publishableKey, status, due, showToast]);

  const close = () => {
    if (!isLoading) onClose?.();
  };

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="sm">
      <DialogTitle>Pay Invoice</DialogTitle>
      <DialogContent dividers>
        {!publishableKey && (
          <Alert severity="error" variant="filled">
            Missing `VITE_STRIPE_PUBLISHABLE_KEY` in frontend `.env`.
          </Alert>
        )}

        {publishableKey && (status === "Paid" || due <= 0) && (
          <Alert severity="info" variant="outlined">
            Invoice already paid. Duplicate payments are not supported.
          </Alert>
        )}

        {publishableKey && isLoading && (
          <Stack direction="row" alignItems="center" spacing={1}>
            <CircularProgress size={18} />
            <Typography variant="body2">Preparing payment...</Typography>
          </Stack>
        )}

        {publishableKey &&
          status !== "Paid" &&
          due > 0 &&
          !isLoading &&
          !clientSecret && (
            <Alert severity="warning" variant="outlined">
              Payment cannot be started. Please try again.
            </Alert>
          )}

        {publishableKey &&
          status !== "Paid" &&
          due > 0 &&
          clientSecret &&
          stripePromise && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <StripeCheckoutForm
                onSuccess={async () => {
                  showToast?.("Payment successful.", "success");
                  if (invoice?._id) await onPaid?.(invoice._id);
                  onClose?.();
                }}
                showToast={showToast}
              />
            </Elements>
          )}
      </DialogContent>
      <DialogActions>
        <Button onClick={close}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

function StripeCheckoutForm({ onSuccess, showToast }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isPaying, setIsPaying] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setIsPaying(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (error) {
        showToast?.(error.message || "Payment failed.", "error");
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        await onSuccess?.();
      } else {
        showToast?.(
          `Payment status: ${paymentIntent?.status || "unknown"}.`,
          "warning",
        );
      }
    } catch (error) {
      console.error("Stripe confirmPayment failed", error);
      showToast?.("Payment failed. Please try again.", "error");
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
      <PaymentElement />
      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
        <Button
          type="submit"
          variant="contained"
          disabled={!stripe || isPaying}
        >
          {isPaying ? "Processing..." : "Pay Now"}
        </Button>
      </Stack>
    </Box>
  );
}

function BillingStatCard({ title, value, note, icon, accent }) {
  return (
    <Paper 
      elevation={0}
      sx={{
        height: "100%",
        p: 2.5,
        borderRadius: 4,
        border: `1px solid ${alpha(accent, 0.15)}`,
        background: `linear-gradient(180deg, ${alpha(accent, 0.09)} 0%, #ffffff 72%)`,
        boxShadow: "0 18px 42px rgba(15, 23, 42, 0.08)",
      }}
    >    
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        spacing={2}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,
              letterSpacing: 0.3,
              color: "text.secondary",
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="h4"
            sx={{
              mt: 0.75,
              fontWeight: 900,
              lineHeight: 1.05,
              fontSize: { xs: 28, md: 34 },
              color: "text.primary",
            }}
          >
            {value}
          </Typography>
          {note ? (
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", display: "block", mt: 0.75 }}
            >
              {note}
            </Typography>
          ) : null}
        </Box>
        <Avatar
          sx={{
            width: 54,
            height: 54,
            borderRadius: 3,
            bgcolor: alpha(accent, 0.12),
            color: accent,
          }}
        >
          {icon}
        </Avatar>
      </Stack>
    </Paper>
  );
}

function SnapshotRow({ label, value, note, progress, accent }) {
  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 3,
        border: `1px solid ${alpha(accent, 0.18)}`,
        background: `linear-gradient(180deg, ${alpha(accent, 0.08)} 0%, ${alpha(
          accent,
          0.04,
        )} 100%)`,
      }}
    >
      <Stack
        direction="row"
        alignItems="baseline"
        justifyContent="space-between"
        spacing={1}
      >
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {label}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1 }}>
          {value}
        </Typography>
      </Stack>
      {note ? (
        <Typography
          variant="caption"
          sx={{ color: "text.secondary", display: "block", mt: 0.5 }}
        >
          {note}
        </Typography>
      ) : null}
      <LinearProgress
        variant="determinate"
        value={Math.max(0, Math.min(100, Number(progress || 0)))}
        sx={{
          mt: 1,
          height: 8,
          borderRadius: 999,
          bgcolor: alpha(accent, 0.16),
          "& .MuiLinearProgress-bar": {
            borderRadius: 999,
            bgcolor: accent,
          },
        }}
      />
    </Box>
  );
}

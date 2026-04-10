import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
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
import CircularProgress from "@mui/material/CircularProgress";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

export default function Billing() {
  const API_BASE_URL = (
    import.meta.env.VITE_API_BASEURL ||
    import.meta.env.api_baseurl ||
    "http://localhost:5000/api"
  ).replace(/\/+$/, "");
  const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";

  const statusOptions = ["Paid", "Unpaid", "Partial"];
  const itemTypeOptions = [
    "Consultation",
    "Room Rent",
    "Medicine",
    "X-ray",
    "Tests",
    "Other",
  ];

  const [invoices, setInvoices] = useState([]);
  const [appointments, setAppointments] = useState([]);

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [selected, setSelected] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showPay, setShowPay] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  const emptyInvoiceForm = {
    _id: null,
    appointmentId: "",
    patientId: "",
    doctorId: "",
    patientName: "",
    doctorName: "",
    invoiceDate: "",
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
  };

  const [invoiceForm, setInvoiceForm] = useState(emptyInvoiceForm);

  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
  };

  const formatMoney = (n) => `₹${Number(n || 0).toFixed(2)}`;
  const formatDateTime = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString();
  };

  const invoiceCalc = useMemo(() => {
    const items = invoiceForm.items || [];
    const subtotal = items.reduce((sum, it) => {
      const qty = Math.max(0, Number(it.qty || 0));
      const price = Math.max(0, Number(it.price || 0));
      return sum + qty * price;
    }, 0);

    const gstPercent = Math.max(0, Number(invoiceForm.gstPercent || 0));
    const discount = Math.max(0, Number(invoiceForm.discountAmount || 0));
    const gstAmount = (subtotal * gstPercent) / 100;
    const total = Math.max(0, subtotal + gstAmount - discount);

    const paid = Math.max(0, Number(invoiceForm.paidAmount || 0));
    const due = Math.max(0, total - paid);

    return { subtotal, gstAmount, total, paid, due };
  }, [
    invoiceForm.discountAmount,
    invoiceForm.gstPercent,
    invoiceForm.items,
    invoiceForm.paidAmount,
  ]);

  const statusChip = (status) => {
    const s = status || "Unpaid";
    const color =
      s === "Paid" ? "success" : s === "Partial" ? "info" : "warning";
    return <Chip size="small" label={s} color={color} variant="filled" />;
  };

  const getPatientName = (inv) =>
    inv?.patientId?.name || inv?.patientName || "-";
  const getDoctorName = (inv) => inv?.doctorId?.name || inv?.doctorName || "-";
  const getStatus = (inv) => inv?.status || inv?.paymentStatus || "Unpaid";
  const getDue = (inv) =>
    Math.max(0, Number(inv?.totalAmount || 0) - Number(inv?.paidAmount || 0));

  const fetchInvoices = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/invoices/get-allinvoices`);
      setInvoices(res.data);
    } catch (err) {
      console.error("Failed to fetch invoices", err);
      showToast("Failed to fetch invoices.", "error");
    }
  };

  const fetchAppointments = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/appointments/get-allappointments`
      );
      setAppointments(res.data);
    } catch (err) {
      console.error("Failed to fetch appointments", err);
      showToast("Failed to load appointments.", "error");
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchAppointments();
  }, []);

  const availableAppointments = useMemo(() => {
    return (appointments || []).filter((a) => !a.invoiceId);
  }, [appointments]);

  const filteredInvoices = useMemo(() => {
    const q = String(searchText || "").trim().toLowerCase();
    return (invoices || []).filter((inv) => {
      const matchesStatus =
        statusFilter === "All" || String(getStatus(inv)) === String(statusFilter);
      const patient = getPatientName(inv).toLowerCase();
      const doctor = getDoctorName(inv).toLowerCase();
      const invoiceNo = String(inv.invoiceNumber || "").toLowerCase();
      const matchesText =
        !q || patient.includes(q) || doctor.includes(q) || invoiceNo.includes(q);
      return matchesStatus && matchesText;
    });
  }, [invoices, searchText, statusFilter]);

  const handleView = (inv) => {
    setSelected(inv);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelected(null);
  };

  const openCreate = () => {
    setInvoiceForm(emptyInvoiceForm);
    if (appointments.length === 0) fetchAppointments();
    setShowEditor(true);
  };

  const openEdit = (inv) => {
    setInvoiceForm({
      _id: inv._id,
      appointmentId: inv.appointmentId?._id || inv.appointmentId || "",
      patientId: inv.patientId?._id || inv.patientId || "",
      doctorId: inv.doctorId?._id || inv.doctorId || "",
      patientName: getPatientName(inv),
      doctorName: getDoctorName(inv),
      invoiceDate: inv.invoiceDate ? String(inv.invoiceDate).slice(0, 10) : "",
      gstPercent: inv.gstPercent ?? 0,
      discountAmount: inv.discountAmount ?? 0,
      paidAmount: inv.paidAmount ?? 0,
      items:
        (inv.items || []).length > 0
          ? inv.items.map((it) => ({
              type: it.type ?? "Other",
              description: it.description ?? "",
              qty: it.qty ?? 1,
              price: it.price ?? 0,
            }))
          : emptyInvoiceForm.items,
    });
    setShowEditor(true);
  };

  const closeEditor = () => {
    if (isSaving) return;
    setShowEditor(false);
    setInvoiceForm(emptyInvoiceForm);
  };

  const handleEditorChange = (e) => {
    setInvoiceForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleAppointmentChange = (e) => {
    const appointmentId = e.target.value;
    const a = availableAppointments.find(
      (x) => String(x._id) === String(appointmentId)
    );
    setInvoiceForm((f) => ({
      ...f,
      appointmentId,
      patientId: a?.patientId ?? "",
      doctorId: a?.doctorId ?? "",
      patientName: a?.patientName ?? f.patientName,
      doctorName: a?.doctorName ?? f.doctorName,
      items: [
        {
          type: "Consultation",
          description: "Consultation",
          qty: 1,
          price: Number(a?.doctorId?.fees || 0) || 0,
        },
      ],
    }));
  };

  const updateItem = (idx, key, value) => {
    setInvoiceForm((f) => {
      const items = [...(f.items || [])];
      items[idx] = { ...items[idx], [key]: value };
      return { ...f, items };
    });
  };

  const addItem = () => {
    setInvoiceForm((f) => ({
      ...f,
      items: [
        ...(f.items || []),
        { type: "Other", description: "", qty: 1, price: 0 },
      ],
    }));
  };

  const removeItem = (idx) => {
    setInvoiceForm((f) => {
      const items = [...(f.items || [])];
      items.splice(idx, 1);
      return { ...f, items: items.length ? items : emptyInvoiceForm.items };
    });
  };

  const normalizeItemsForSave = () => {
    const items = (invoiceForm.items || [])
      .map((it) => ({
        type: it.type || "Other",
        description: String(it.description || "").trim(),
        qty: Number(it.qty || 0),
        price: Number(it.price || 0),
      }))
      .filter((it) => it.description !== "");

    for (const it of items) {
      if (it.qty <= 0 || it.price < 0) {
        return { error: "Quantity must be >= 1 and price must be >= 0." };
      }
    }

    return { items };
  };

  const saveInvoice = async (e) => {
    e.preventDefault();

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
        appointmentId: invoiceForm.appointmentId,
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

      let saved;
      if (invoiceForm._id) {
        saved = (
          await axios.put(
            `${API_BASE_URL}/invoices/update/${invoiceForm._id}`,
            payload
          )
        ).data;
        showToast("Invoice updated.", "success");
      } else {
        saved = (
          await axios.post(`${API_BASE_URL}/invoices/createInvoice`, payload)
        ).data;
        showToast("Invoice created.", "success");
      }

      setInvoices((list) => {
        const exists = list.some((x) => x._id === saved._id);
        if (exists) return list.map((x) => (x._id === saved._id ? saved : x));
        return [saved, ...list];
      });

      fetchAppointments();
      closeEditor();
    } catch (err) {
      console.error("Failed to save invoice", err);
      showToast("Failed to save invoice.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const setPaidAmount = async (inv, paidAmount) => {
    try {
      const res = await axios.patch(
        `${API_BASE_URL}/invoices/${inv._id}/payment`,
        { paidAmount }
      );
      showToast("Payment updated.", "success");
      setInvoices((list) =>
        list.map((x) => (x._id === inv._id ? res.data : x))
      );
      if (selected?._id === inv._id) setSelected(res.data);
    } catch (err) {
      console.error("Failed to update payment", err);
      showToast("Failed to update payment.", "error");
    }
  };
  const markPaidToggle = async (inv) => {
    if (getStatus(inv) === "Paid") {
      showToast(
        "Invoice already paid. Duplicate payments are not allowed.",
        "warning"
      );
      return;
    }

    const total = Number(inv.totalAmount || 0);
    await setPaidAmount(inv, total);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/invoices/${id}`);
      showToast("Invoice deleted.", "success");
      setInvoices((list) => list.filter((x) => x._id !== id));
      if (selected?._id === id) handleCloseDetails();
    } catch (err) {
      console.error("Failed to delete invoice", err);
      showToast("Failed to delete invoice.", "error");
    }
  };

  const downloadAsPdf = (inv) => {
    const patientName = getPatientName(inv);
    const doctorName = getDoctorName(inv);
    const apptDate = inv?.appointmentId?.appointmentDate;

    const rows = (inv.items || [])
      .map(
        (it) => `
          <tr>
            <td>${it.type || ""}</td>
            <td>${it.description || ""}</td>
            <td style="text-align:right">${it.qty ?? 1}</td>
            <td style="text-align:right">${Number(it.price || 0).toFixed(2)}</td>
            <td style="text-align:right">${(
              Number(it.qty || 0) * Number(it.price || 0)
            ).toFixed(2)}</td>
          </tr>
        `
      )
      .join("\n");

    const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${inv.invoiceNumber || "Invoice"}</title>
  <style>
    body{font-family: Arial, sans-serif; padding:24px;}
    h1{margin:0 0 8px 0; font-size:20px;}
    .meta{margin:0 0 16px 0; font-size:12px; color:#333;}
    table{width:100%; border-collapse:collapse; margin-top:12px;}
    th,td{border:1px solid #ddd; padding:8px; font-size:12px;}
    th{background:#f5f5f5; text-align:left;}
    .totals{margin-top:12px; width:320px; margin-left:auto;}
    .totals td{border:none; padding:4px 0;}
    .right{text-align:right;}
    @media print{button{display:none;}}
  </style>
</head>
<body>
  <h1>Hospital Invoice</h1>
  <div class="meta">
    <div><b>Invoice No:</b> ${inv.invoiceNumber || "-"}</div>
    <div><b>Invoice Date:</b> ${formatDateTime(inv.invoiceDate)}</div>
    <div><b>Patient:</b> ${patientName}</div>
    <div><b>Doctor:</b> ${doctorName}</div>
    <div><b>Appointment:</b> ${apptDate ? formatDateTime(apptDate) : "-"}</div>
    <div><b>Status:</b> ${getStatus(inv)}</div>
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
      ${rows || "<tr><td colspan='5' style='text-align:center'>No items</td></tr>"}
    </tbody>
  </table>

  <table class="totals">
    <tr><td>Subtotal</td><td class="right">${Number(inv.subtotalAmount || 0).toFixed(2)}</td></tr>
    <tr><td>GST (${Number(inv.gstPercent || 0).toFixed(2)}%)</td><td class="right">${Number(inv.gstAmount || 0).toFixed(2)}</td></tr>
    <tr><td>Discount</td><td class="right">${Number(inv.discountAmount || 0).toFixed(2)}</td></tr>
    <tr><td><b>Total</b></td><td class="right"><b>${Number(inv.totalAmount || 0).toFixed(2)}</b></td></tr>
    <tr><td>Paid</td><td class="right">${Number(inv.paidAmount || 0).toFixed(2)}</td></tr>
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

      if (iframe.contentWindow) iframe.contentWindow.onafterprint = cleanup;
      setTimeout(doPrint, 100);
    } catch (e) {
      console.error("PDF print failed", e);
      showToast(
        "PDF export blocked by the browser. Allow popups/print and try again.",
        "error"
      );
    }
  };

  return (
    <Box sx={{ px: 2, py: 3 }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "stretch", md: "center" }}
        justifyContent="space-between"
        spacing={1}
        sx={{ mb: 2 }}
      >
        <Typography variant="h5" fontWeight={700}>
          Billing / Invoices
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <TextField
            size="small"
            label="Search (patient/doctor/invoice)"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="invoice-status-filter">Status</InputLabel>
            <Select
              labelId="invoice-status-filter"
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="All">All</MenuItem>
              {statusOptions.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="outlined" onClick={fetchInvoices}>
            Refresh
          </Button>
          <Button variant="contained" onClick={openCreate}>
            Create Invoice
          </Button>
        </Stack>
      </Stack>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Invoice</TableCell>
              <TableCell>Patient</TableCell>
              <TableCell>Doctor</TableCell>
              <TableCell>Appointment</TableCell>
              <TableCell>Invoice Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredInvoices.map((inv) => (
              <TableRow key={inv._id} hover>
                <TableCell>{inv.invoiceNumber || "-"}</TableCell>
                <TableCell>{getPatientName(inv)}</TableCell>
                <TableCell>{getDoctorName(inv)}</TableCell>
                <TableCell>
                  {formatDateTime(inv?.appointmentId?.appointmentDate)}
                </TableCell>
                <TableCell>{formatDateTime(inv.invoiceDate)}</TableCell>
                <TableCell>{statusChip(getStatus(inv))}</TableCell>
                <TableCell>{formatMoney(inv.totalAmount)}</TableCell>
                <TableCell align="right">
                  <IconButton
                    aria-label="view"
                    onClick={() => handleView(inv)}
                    size="small"
                  >
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    aria-label="pdf"
                    onClick={() => downloadAsPdf(inv)}
                    size="small"
                  >
                    <PictureAsPdfIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    aria-label="edit"
                    onClick={() => openEdit(inv)}
                    size="small"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <Button
                    size="small"
                    variant="contained"
                    sx={{ ml: 1 }}
                    onClick={() => markPaidToggle(inv)}
                    disabled={getStatus(inv) === "Paid"}
                  >
                    {getStatus(inv) === "Paid" ? "Paid" : "Mark Paid"}
                  </Button>
                  <IconButton
                    aria-label="delete"
                    onClick={() => handleDelete(inv._id)}
                    size="small"
                    color="error"
                    sx={{ ml: 1 }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filteredInvoices.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No invoices found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={showEditor}
        onClose={closeEditor}
        fullWidth
        maxWidth="md"
      >
        <Box component="form" onSubmit={saveInvoice}>
          <DialogTitle>
            {invoiceForm._id ? "Update Invoice" : "Create Invoice"}
          </DialogTitle>
          <DialogContent dividers>
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
                    {availableAppointments.map((a) => (
                      <MenuItem key={a._id} value={a._id}>
                        {a.patientName} - {a.doctorName} ({formatDateTime(
                          a.appointmentDate
                        )})
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
                />
                <TextField
                  label="Doctor"
                  name="doctorName"
                  size="small"
                  value={invoiceForm.doctorName}
                  onChange={handleEditorChange}
                  fullWidth
                  required
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

              <Box>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ mb: 1 }}
                >
                  <Typography variant="subtitle2">Items</Typography>
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={addItem}
                  >
                    Add Item
                  </Button>
                </Stack>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 150 }}>Type</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell sx={{ width: 100 }}>Qty</TableCell>
                      <TableCell sx={{ width: 140 }}>Price</TableCell>
                      <TableCell sx={{ width: 60 }} />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(invoiceForm.items || []).map((it, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <FormControl fullWidth size="small">
                            <Select
                              value={it.type || "Other"}
                              onChange={(e) =>
                                updateItem(idx, "type", e.target.value)
                              }
                            >
                              {itemTypeOptions.map((opt) => (
                                <MenuItem key={opt} value={opt}>
                                  {opt}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={it.description}
                            onChange={(e) =>
                              updateItem(idx, "description", e.target.value)
                            }
                            fullWidth
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            inputProps={{ min: 1 }}
                            value={it.qty}
                            onChange={(e) =>
                              updateItem(idx, "qty", e.target.value)
                            }
                            fullWidth
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            inputProps={{ min: 0, step: "0.01" }}
                            value={it.price}
                            onChange={(e) =>
                              updateItem(idx, "price", e.target.value)
                            }
                            fullWidth
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeItem(idx)}
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
                        <Typography variant="subtitle2">Subtotal</Typography>
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
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeEditor} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={isSaving}>
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
      >
        <DialogTitle>Invoice Details</DialogTitle>
        <DialogContent dividers>
          {!selected ? (
            <Typography variant="body2" color="text.secondary">
              No invoice selected.
            </Typography>
          ) : (
            <Stack spacing={1.25}>
              <Typography variant="body2">
                <b>Invoice:</b> {selected.invoiceNumber || "-"}
              </Typography>
              <Typography variant="body2">
                <b>Patient:</b> {getPatientName(selected)}
              </Typography>
              <Typography variant="body2">
                <b>Doctor:</b> {getDoctorName(selected)}
              </Typography>
              <Typography variant="body2">
                <b>Appointment:</b>{" "}
                {formatDateTime(selected?.appointmentId?.appointmentDate)}
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

              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Items
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Qty</TableCell>
                      <TableCell>Price</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(selected.items || []).map((it, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{it.type ?? "-"}</TableCell>
                        <TableCell>{it.description}</TableCell>
                        <TableCell>{it.qty ?? 1}</TableCell>
                        <TableCell>{formatMoney(it.price)}</TableCell>
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
        <DialogActions>
          {selected && STRIPE_PUBLISHABLE_KEY && getStatus(selected) !== "Paid" && getDue(selected) > 0 && (
            <Button variant="contained" onClick={() => setShowPay(true)}>
              Pay (Stripe)
            </Button>
          )}
          {selected && (
            <Button variant="contained" onClick={() => markPaidToggle(selected)}
              disabled={getStatus(selected) === "Paid"}>
              {getStatus(selected) === "Paid" ? "Paid" : "Mark Paid"}
            </Button>
          )}
          {selected && (
            <Button variant="outlined" onClick={() => downloadAsPdf(selected)}>
              Download PDF
            </Button>
          )}
          <Button onClick={handleCloseDetails}>Close</Button>
        </DialogActions>
      </Dialog>

      <PayInvoiceDialog
        open={showPay}
        onClose={() => setShowPay(false)}
        invoice={selected}
        apiBaseUrl={API_BASE_URL}
        publishableKey={STRIPE_PUBLISHABLE_KEY}
        showToast={showToast}
        onPaid={async (invoiceId) => {
          const inv = invoices.find((x) => x._id === invoiceId) || selected;
          if (inv) await setPaidAmount(inv, Number(inv.totalAmount || 0));
          await fetchInvoices();
        }}
      />

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        sx={{ mt: 2 }}
      >
        <Alert
          onClose={() => setToast((t) => ({ ...t, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}








function PayInvoiceDialog({ open, onClose, invoice, apiBaseUrl, publishableKey, showToast, onPaid }) {
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const status = invoice?.status || invoice?.paymentStatus || "Unpaid";
  const due = Math.max(
    0,
    Number(invoice?.totalAmount || 0) - Number(invoice?.paidAmount || 0)
  );

  const stripePromise = useMemo(
    () => (publishableKey ? loadStripe(publishableKey) : null),
    [publishableKey]
  );

  useEffect(() => {
    if (!open || !invoice?._id || !publishableKey) return;
    if (status === "Paid" || due <= 0) {
      setIsLoading(false);
      setClientSecret("");
      return;
    }

    let isActive = true;
    setIsLoading(true);
    setClientSecret("");

    axios
      .post(`${apiBaseUrl}/payments/create-intent`, { invoiceId: invoice._id })
      .then((res) => {
        if (!isActive) return;
        setClientSecret(res.data?.clientSecret || "");
      })
      .catch((err) => {
        console.error("Failed to create payment intent", err);
        showToast?.("Failed to start payment.", "error");
        if (isActive) setClientSecret("");
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [open, invoice?._id, status, due, apiBaseUrl, publishableKey, showToast]);

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
            <Typography variant="body2">Preparing payment…</Typography>
          </Stack>
        )}

        {publishableKey && status !== "Paid" && due > 0 && !isLoading && !clientSecret && (
          <Alert severity="warning" variant="outlined">
            Payment cannot be started. Please try again.
          </Alert>
        )}

        {publishableKey && status !== "Paid" && due > 0 && clientSecret && stripePromise && (
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

  const handleSubmit = async (e) => {
    e.preventDefault();
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
          "warning"
        );
      }
    } catch (err) {
      console.error("Stripe confirmPayment failed", err);
      showToast?.("Payment failed. Please try again.", "error");
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
      <PaymentElement />
      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
        <Button type="submit" variant="contained" disabled={!stripe || isPaying}>
          {isPaying ? "Processing..." : "Pay Now"}
        </Button>
      </Stack>
    </Box>
  );
}















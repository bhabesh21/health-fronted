import React, { useEffect, useState } from "react";
import axios from "axios";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
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
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

export default function Appointments() {
  const API_BASE_URL = (
    import.meta.env.VITE_API_BASEURL ||
    import.meta.env.api_baseurl ||
    "http://localhost:5000/api"
  ).replace(/\/+$/, "");

  const statusOptions = ["Scheduled", "Approved", "Completed", "Cancelled"];

  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const emptyForm = {
    patientId: "",
    patientName: "",
    doctorId: "",
    doctorName: "",
    date: "",
    time: "",
    status: "Scheduled",
    notes: "",
    diagnosis: "",
    prescription: "",
    consultationNotes: "",
    followUpDate: "",
  };

  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
  };

  const splitDateTime = (value) => {
    if (!value) return { date: "", time: "" };
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return { date: "", time: "" };

    const pad2 = (n) => String(n).padStart(2, "0");
    const date = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(
      d.getDate()
    )}`;
    const time = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
    return { date, time };
  };

  const normalizeForm = (a = {}) => {
    const { date, time } = splitDateTime(a.appointmentDate);
    const followUp = splitDateTime(a.followUpDate);

    return {
      patientId: a.patientId ?? "",
      patientName: a.patientName ?? "",
      doctorId: a.doctorId ?? "",
      doctorName: a.doctorName ?? "",
      date,
      time,
      status: a.status ?? "Scheduled",
      notes: a.notes ?? "",
      diagnosis: a.diagnosis ?? "",
      prescription: a.prescription ?? "",
      consultationNotes: a.consultationNotes ?? "",
      followUpDate: followUp.date ?? "",
    };
  };

  const toPayload = () => {
    const dt = form.date
      ? new Date(`${form.date}T${form.time || "00:00"}:00`)
      : null;
    const fu = form.followUpDate
      ? new Date(`${form.followUpDate}T00:00:00`)
      : null;

    return {
      patientId: form.patientId || undefined,
      patientName: form.patientName,
      doctorId: form.doctorId || undefined,
      doctorName: form.doctorName,
      appointmentDate: dt ? dt.toISOString() : undefined,
      status: form.status || "Scheduled",
      notes: form.notes || undefined,
      diagnosis: form.diagnosis || undefined,
      prescription: form.prescription || undefined,
      consultationNotes: form.consultationNotes || undefined,
      followUpDate: fu ? fu.toISOString() : undefined,
    };
  };

  const fetchAppointments = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/appointments/get-allappointments`
      );
      setAppointments(res.data);
    } catch (err) {
      console.error("Failed to fetch appointments", err);
      showToast("Failed to fetch appointments.", "error");
    }
  };

  const fetchLookups = async () => {
    try {
      const [patientsRes, doctorsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/patients/get-allpatients`),
        axios.get(`${API_BASE_URL}/doctors/get-doctors`),
      ]);
      setPatients(patientsRes.data);
      setDoctors(doctorsRes.data);
    } catch (err) {
      console.error("Failed to fetch patients/doctors", err);
      showToast("Failed to load patients/doctors.", "error");
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchLookups();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePatientChange = (e) => {
    const patientId = e.target.value;
    const selected = patients.find((p) => String(p._id) === String(patientId));
    setForm((f) => ({
      ...f,
      patientId,
      patientName: selected?.name ?? f.patientName,
    }));
  };

  const handleDoctorChange = (e) => {
    const doctorId = e.target.value;
    const selected = doctors.find((d) => String(d._id) === String(doctorId));
    setForm((f) => ({
      ...f,
      doctorId,
      doctorName: selected?.name ?? f.doctorName,
    }));
  };

  const handleCloseDialog = () => {
    if (isSaving) return;
    setShowDialog(false);
    setForm(emptyForm);
    setEditId(null);
  };

  const handleOpenAdd = () => {
    setForm(emptyForm);
    setEditId(null);
    if (patients.length === 0 || doctors.length === 0) fetchLookups();
    setShowDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.patientName || !form.doctorName) {
      showToast("Please select patient and doctor.", "error");
      return;
    }

    setIsSaving(true);
    try {
      const payload = toPayload();

      const res = editId
        ? await axios.put(
            `${API_BASE_URL}/appointments/update/${editId}`,
            payload
          )
        : await axios.post(
            `${API_BASE_URL}/appointments/createAppointment`,
            payload
          );

      const saved = res.data?.appointment ?? res.data;
      const invoice = res.data?.invoice;

      if (invoice) {
        showToast("Appointment saved. Invoice generated.", "success");
      } else {
        showToast(
          editId ? "Appointment updated successfully." : "Appointment created successfully.",
          "success"
        );
      }

      setForm(emptyForm);
      setEditId(null);
      setShowDialog(false);
      fetchAppointments();

      // keep eslint quiet about saved for future UI expansions
      void saved;
    } catch (err) {
      console.error("Failed to save appointment", err);
      showToast("Failed to save appointment. Please try again.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/appointments/${id}`);
      showToast("Appointment deleted.", "success");
      fetchAppointments();
    } catch (err) {
      console.error("Failed to delete appointment", err);
      showToast("Failed to delete appointment. Please try again.", "error");
    }
  };

  const handleEdit = (a) => {
    setForm(normalizeForm(a));
    setEditId(a._id);
    if (patients.length === 0 || doctors.length === 0) fetchLookups();
    setShowDialog(true);
  };

  const formatDateTime = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString();
  };

  return (
    <Box sx={{ px: 2, py: 3 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Typography variant="h5" fontWeight={700}>
          Appointment Management
        </Typography>
        <Button variant="contained" onClick={handleOpenAdd}>
          Add Appointment
        </Button>
      </Stack>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Patient</TableCell>
              <TableCell>Doctor</TableCell>
              <TableCell>Date &amp; Time</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Notes</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {appointments.map((a) => (
              <TableRow key={a._id} hover>
                <TableCell>{a.patientName}</TableCell>
                <TableCell>{a.doctorName}</TableCell>
                <TableCell>{formatDateTime(a.appointmentDate)}</TableCell>
                <TableCell>{a.status ?? "-"}</TableCell>
                <TableCell>{a.notes ?? "-"}</TableCell>
                <TableCell align="right">
                  <IconButton
                    aria-label="edit"
                    onClick={() => handleEdit(a)}
                    size="small"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    aria-label="delete"
                    onClick={() => handleDelete(a._id)}
                    size="small"
                    color="error"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {appointments.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No appointments found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={showDialog}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
      >
        <Box component="form" onSubmit={handleSubmit}>
          <DialogTitle>
            {editId ? "Update Appointment" : "Add Appointment"}
          </DialogTitle>

          <DialogContent dividers>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <FormControl fullWidth required size="small">
                <InputLabel id="appointment-patient-label">Patient</InputLabel>
                <Select
                  labelId="appointment-patient-label"
                  label="Patient"
                  name="patientId"
                  value={form.patientId}
                  onChange={handlePatientChange}
                >
                  <MenuItem value="" disabled>
                    Select patient
                  </MenuItem>
                  {patients.map((p) => (
                    <MenuItem key={p._id} value={p._id}>
                      {p.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth required size="small">
                <InputLabel id="appointment-doctor-label">Doctor</InputLabel>
                <Select
                  labelId="appointment-doctor-label"
                  label="Doctor"
                  name="doctorId"
                  value={form.doctorId}
                  onChange={handleDoctorChange}
                >
                  <MenuItem value="" disabled>
                    Select doctor
                  </MenuItem>
                  {doctors.map((d) => (
                    <MenuItem key={d._id} value={d._id}>
                      {d.name}
                      {d.specialization ? ` (${d.specialization})` : ""}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Date"
                  name="date"
                  type="date"
                  size="small"
                  value={form.date}
                  onChange={handleChange}
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Time"
                  name="time"
                  type="time"
                  size="small"
                  value={form.time}
                  onChange={handleChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>

              <FormControl fullWidth size="small">
                <InputLabel id="appointment-status-label">Status</InputLabel>
                <Select
                  labelId="appointment-status-label"
                  label="Status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  {statusOptions.map((opt) => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Notes"
                name="notes"
                size="small"
                value={form.notes}
                onChange={handleChange}
                fullWidth
                multiline
                minRows={2}
              />

              {form.status === "Completed" && (
                <>
                  <TextField
                    label="Diagnosis"
                    name="diagnosis"
                    size="small"
                    value={form.diagnosis}
                    onChange={handleChange}
                    fullWidth
                  />

                  <TextField
                    label="Prescription"
                    name="prescription"
                    size="small"
                    value={form.prescription}
                    onChange={handleChange}
                    fullWidth
                    multiline
                    minRows={2}
                  />

                  <TextField
                    label="Consultation Notes"
                    name="consultationNotes"
                    size="small"
                    value={form.consultationNotes}
                    onChange={handleChange}
                    fullWidth
                    multiline
                    minRows={2}
                  />

                  <TextField
                    label="Follow-up Date"
                    name="followUpDate"
                    type="date"
                    size="small"
                    value={form.followUpDate}
                    onChange={handleChange}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </>
              )}
            </Stack>
          </DialogContent>

          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={isSaving}>
              {isSaving ? "Saving..." : editId ? "Update" : "Add"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

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

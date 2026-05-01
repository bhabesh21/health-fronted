import React, { useEffect, useState } from "react";
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
import Card from "@mui/material/Card";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { ThreeDots } from "react-loader-spinner";

import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DesktopDatePicker } from "@mui/x-date-pickers/DesktopDatePicker";

import api from "../api/api-handler";

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
  };

  const emptyForm = {
    patientId: "",
    doctorId: "",
    date: "",
    time: "",
  };

  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showDialog, setShowDialog] = useState(false);

  // FETCH
  const fetchAppointments = async () => {
    setLoading(true);
    const start = Date.now();

    try {
      const res = await api.get("/admin/appointments/getAll");
      setAppointments(res.data.data);
    } catch {
      showToast("Failed to fetch appointments", "error");
    } finally {
      const remaining = 2000 - (Date.now() - start);
      setTimeout(() => setLoading(false), remaining > 0 ? remaining : 0);
    }
  };

  const fetchLookups = async () => {
    try {
      const [pRes, dRes] = await Promise.all([
        api.get("/admin/patients/getAll"),
        api.get("/doctors/admin/doctors"),
      ]);
      setPatients(pRes.data.patients);
      setDoctors(dRes.data);
    } catch {
      showToast("Failed to load data", "error");
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchLookups();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEdit = (a) => {
    setForm({
      patientId: a.patient?._id || "",
      doctorId: a.doctor?._id || "",
      date: a.date ? a.date.split("T")[0] : "",
      time: a.time || "",
    });
    setEditId(a._id);
    setShowDialog(true);
  };

  // SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.patientId || !form.doctorId) {
      showToast("Select patient & doctor", "error");
      return;
    }

    try {
      const payload = {
        patient: form.patientId,
        doctor: form.doctorId,
        date: form.date,
        time: form.time,
      };

      if (editId) {
        await api.put(`/admin/appointments/update/${editId}`, payload);
        showToast("Updated successfully");
      } else {
        await api.post(`/admin/appointments/create`, payload);
        showToast("Created successfully");
      }

      setForm(emptyForm);
      setEditId(null);
      setShowDialog(false);
      fetchAppointments();
    } catch {
      showToast("Error saving", "error");
    }
  };

  // DELETE (smooth)
  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/appointments/delete/${id}`);
      setAppointments((prev) => prev.filter((a) => a._id !== id));
      showToast("Deleted");
    } catch {
      showToast("Delete failed", "error");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* UI */}
      {loading ? (
        <Card>
          <Box display="flex" justifyContent="center" mt={5}>
            <ThreeDots height="80" width="80" color="gray" />
          </Box>
        </Card>
      ) : appointments.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center", mt: 3 }}>
          <Typography>No Appointments Found</Typography>
          <Button variant="contained" sx={{ mt: 2 }} onClick={() => setShowDialog(true)}>
            Add Appointment
          </Button>
        </Paper>
      ) : (
        <div>
          <Stack direction="row" justifyContent="space-between" mb={2}>
            <Typography variant="h5">Appointments</Typography>
            <Button variant="contained" onClick={() => setShowDialog(true)}>
              Add Appointment
            </Button>
          </Stack>

          <Card component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Patient</TableCell>
                  <TableCell>Doctor</TableCell>
                  <TableCell>Date & Time</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {appointments.map((a) => (
                  <TableRow key={a._id}>
                    <TableCell>{a.patient?.name}</TableCell>
                    <TableCell>{a.doctor?.name}</TableCell>
                    <TableCell>
                      {new Date(a.date).toLocaleDateString()} {a.time}
                    </TableCell>
                    <TableCell>{a.status}</TableCell>
                    <TableCell align="right">
                       <IconButton onClick={() => handleEdit(a)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(a._id)}>
                        <DeleteIcon color="error" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* Toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        onClose={() => setToast({ ...toast, open: false })}
      >
        <Alert severity={toast.severity} variant="filled">
          {toast.message}
        </Alert>
      </Snackbar>

      {/* Dialog */}
      <Dialog open={showDialog} onClose={() => setShowDialog(false)} fullWidth>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogTitle>{editId ? "Update" : "Add"} Appointment</DialogTitle>

          <DialogContent>
            <Stack spacing={2} mt={1}>
              <FormControl fullWidth size="small">
                <InputLabel>Patient</InputLabel>
                <Select name="patientId" value={form.patientId} onChange={handleChange}>
                  {patients.map((p) => (
                    <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Doctor</InputLabel>
                <Select name="doctorId" value={form.doctorId} onChange={handleChange}>
                  {doctors.map((d) => (
                    <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* ✅ FIXED DATE PICKER */}
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DesktopDatePicker
                  label="Select Date"
                  value={form.date ? dayjs(form.date) : null}
                  onChange={(newValue) => {
                    setForm({
                      ...form,
                      date: newValue ? newValue.format("YYYY-MM-DD") : "",
                    });
                  }}
                  renderInput={(params) => (
                    <TextField {...params} size="small" fullWidth />
                  )}
                />
              </LocalizationProvider>

              {/* TIME */}
              <TextField
                label="Select Time"
                type="time"
                name="time"
                size="small"
                value={form.time}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
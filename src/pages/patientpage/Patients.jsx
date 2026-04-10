import React, { useEffect, useState } from "react";
import axios from "axios";
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
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
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

export default function Patients() {
  const API_BASE_URL = (
    import.meta.env.VITE_API_BASEURL ||
    import.meta.env.api_baseurl ||
    "http://localhost:5000/api"
  ).replace(/\/+$/, "");

  const genderOptions = ["Male", "Female", "Other"];

  const [patients, setPatients] = useState([]);
  const emptyForm = {
    name: "",
    age: "",
    gender: "",
    phone: "",
    disease: "",
    address: "",
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

  const normalizeForm = (p = {}) => ({
    name: p.name ?? "",
    age: p.age ?? "",
    gender: p.gender ?? "",
    phone: p.phone ?? "",
    disease: p.disease ?? "",
    address: p.address ?? "",
  });

  const toPayload = () => ({
    name: form.name,
    age: form.age === "" ? undefined : Number(form.age),
    gender: form.gender || undefined,
    phone: form.phone || undefined,
    disease: form.disease || undefined,
    address: form.address || undefined,
  });

  // GET Patients
  const fetchPatients = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/patients/get-allpatients`);
      setPatients(res.data);
    } catch (err) {
      console.error("Failed to fetch patients", err);
      showToast("Failed to fetch patients.", "error");
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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
    setShowDialog(true);
  };

  // ADD / UPDATE Patient
  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSaving(true);
    try {
      const payload = toPayload();

      if (editId) {
        await axios.put(
          `${API_BASE_URL}/patients/update/${editId}`,
          payload
        );
        showToast("Patient updated successfully.", "success");
      } else {
        await axios.post(`${API_BASE_URL}/patients/createPatient`, payload);
        showToast("Patient added successfully.", "success");
      }

      setForm(emptyForm);
      setEditId(null);
      setShowDialog(false);
      fetchPatients();
    } catch (err) {
      console.error("Failed to save patient", err);
      showToast("Failed to save patient. Please try again.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // DELETE Patient
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/patients/${id}`);
      showToast("Patient deleted.", "success");
      fetchPatients();
    } catch (err) {
      console.error("Failed to delete patient", err);
      showToast("Failed to delete patient. Please try again.", "error");
    }
  };

  // EDIT Patient
  const handleEdit = (p) => {
    setForm(normalizeForm(p));
    setEditId(p._id);
    setShowDialog(true);
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
          Patient Management
        </Typography>
        <Button variant="contained" onClick={handleOpenAdd}>
          Add Patient
        </Button>
      </Stack>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Age</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Disease</TableCell>
              <TableCell>Address</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {patients.map((p) => (
              <TableRow key={p._id} hover>
                <TableCell>{p.name}</TableCell>
                <TableCell>{p.age ?? "-"}</TableCell>
                <TableCell>{p.gender ?? "-"}</TableCell>
                <TableCell>{p.phone ?? "-"}</TableCell>
                <TableCell>{p.disease ?? "-"}</TableCell>
                <TableCell>{p.address ?? "-"}</TableCell>
                <TableCell align="right">
                  <IconButton
                    aria-label="edit"
                    onClick={() => handleEdit(p)}
                    size="small"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    aria-label="delete"
                    onClick={() => handleDelete(p._id)}
                    size="small"
                    color="error"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {patients.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No patients found
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
          <DialogTitle>{editId ? "Update Patient" : "Add Patient"}</DialogTitle>

          <DialogContent dividers>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                label="Name"
                name="name"
                size="small"
                value={form.name}
                onChange={handleChange}
                fullWidth
                required
              />

              <TextField
                label="Age"
                name="age"
                type="number"
                size="small"
                value={form.age}
                onChange={handleChange}
                fullWidth
                inputProps={{ min: 0 }}
              />

              <FormControl fullWidth size="small">
                <InputLabel id="patient-gender-label">Gender</InputLabel>
                <Select
                  labelId="patient-gender-label"
                  label="Gender"
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                >
                  <MenuItem value="" disabled>
                    Select gender
                  </MenuItem>
                  {genderOptions.map((opt) => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Phone"
                name="phone"
                size="small"
                value={form.phone}
                onChange={handleChange}
                fullWidth
              />

              <TextField
                label="Disease"
                name="disease"
                size="small"
                value={form.disease}
                onChange={handleChange}
                fullWidth
              />

              <TextField
                label="Address"
                name="address"
                size="small"
                value={form.address}
                onChange={handleChange}
                fullWidth
                multiline
                minRows={2}
              />
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

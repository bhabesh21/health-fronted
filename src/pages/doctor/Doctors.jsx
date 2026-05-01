import React, { useEffect, useState } from "react";
import { ThreeDots } from "react-loader-spinner";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import Card from "@mui/material/Card";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";

import api from "../../api/api-handler";

const Doctor = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
  };

  const emptyForm = {
    name: "",
    specialization: "",
    experience: "",
    fees: "",
    contact: "",
    email: "",
  };

  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const specializationOptions = [
    "Cardiologist",
    "Dermatologist",
    "ENT Specialist",
    "General Physician",
    "Gynecologist",
    "Neurologist",
    "Orthopedic",
    "Pediatrician",
    "Psychiatrist",
    "Radiologist",
    "Surgeon",
  ];

  // ✅ GET
  const fetchDoctors = async () => {
    setLoading(true);
    const startTime = Date.now();

    try {
      const res = await api.get("/doctors/admin/doctors");
      setDoctors(res.data);
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch doctors", "error");
    } finally {
      const elapsed = Date.now() - startTime;
      const remaining = 2000 - elapsed;

      setTimeout(() => {
        setLoading(false);
      }, remaining > 0 ? remaining : 0);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleOpenAdd = () => {
    setForm(emptyForm);
    setEditId(null);
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    if (isSaving) return;
    setShowDialog(false);
    setForm(emptyForm);
    setEditId(null);
  };

  // ✅ ADD / UPDATE
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setLoading(true);

    try {
      if (editId) {
        await api.put(`/doctors/admin/update-doctor/${editId}`, form);
        showToast("Doctor updated successfully");
      } else {
        await api.post(`/doctors/admin/create-doctor`, form);
        showToast("Doctor added successfully");
      }

      setShowDialog(false);
      fetchDoctors();
    } catch (err) {
      console.error(err);
      showToast("Failed to save doctor", "error");
    } finally {
      setIsSaving(false);
      setLoading(false);
    }
  };

  // ✅ DELETE (🔥 FIXED - NO FLICKER)
  const handleDelete = async (id) => {
    try {
      await api.delete(`/doctors/admin/delete-doctor/${id}`);

      // ✅ smooth UI update
      setDoctors((prev) => prev.filter((doc) => doc._id !== id));

      showToast("Doctor deleted");
    } catch (err) {
      console.error(err);
      showToast("Delete failed", "error");
    }
  };

  const handleEdit = (doc) => {
    setForm(doc);
    setEditId(doc._id);
    setShowDialog(true);
  };

  return (
    <Box sx={{ px: 2, py: 3 }}>
      {/* Loader / Empty / Table */}
      {loading ? (
        <Card>
          <Box display="flex" justifyContent="center" alignItems="center" height="300px">
            <ThreeDots height="80" width="80" color="#4fa94d" />
          </Box>
        </Card>
      ) : doctors.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center", mt: 3 }}>
          <Typography>No Doctors Found</Typography>
          <Button variant="contained" onClick={handleOpenAdd} sx={{ mt: 2 }}>
            Add Doctor
          </Button>
        </Paper>
      ) : (
        <div>
          <Stack direction="row" justifyContent="space-between" mb={2}>
            <Typography variant="h5">Doctor Management</Typography>
            <Button variant="contained" onClick={handleOpenAdd}>
              Add Doctor
            </Button>
          </Stack>

          <Card component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Specialization</TableCell>
                  <TableCell>Experience</TableCell>
                  <TableCell>Fees</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {doctors.map((doc) => (
                  <TableRow key={doc._id}>
                    <TableCell>{doc.name}</TableCell>
                    <TableCell>{doc.specialization}</TableCell>
                    <TableCell>{doc.experience}</TableCell>
                    <TableCell>{doc.fees}</TableCell>
                    <TableCell>{doc.contact}</TableCell>
                    <TableCell>{doc.email}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEdit(doc)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleDelete(doc._id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* ✅ Toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setToast({ ...toast, open: false })}
          severity={toast.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {toast.message}
        </Alert>
      </Snackbar>

      {/* Dialog */}
      <Dialog open={showDialog} onClose={handleCloseDialog} fullWidth>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogTitle>{editId ? "Update Doctor" : "Add Doctor"}</DialogTitle>

          <DialogContent>
            <Stack spacing={2} mt={1}>
              <TextField label="Name" name="name" size="small" value={form.name} onChange={handleChange} required />

              <FormControl fullWidth size="small">
                <InputLabel>Specialization</InputLabel>
                <Select name="specialization" value={form.specialization} onChange={handleChange}>
                  {specializationOptions.map((opt) => (
                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField label="Experience" name="experience" size="small" value={form.experience} onChange={handleChange} />
              <TextField label="Fees" name="fees" size="small" value={form.fees} onChange={handleChange} />
              <TextField label="Contact" name="contact" size="small" value={form.contact} onChange={handleChange} />
              <TextField label="Email" name="email" size="small" value={form.email} onChange={handleChange} />
            </Stack>
          </DialogContent>

          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editId ? "Update" : "Add"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default Doctor;
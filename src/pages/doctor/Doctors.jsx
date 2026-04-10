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

const Doctor = () => {
  const API_BASE_URL = (
    import.meta.env.VITE_API_BASEURL ||
    import.meta.env.api_baseurl ||
    "http://localhost:5000/api"
  ).replace(/\/+$/, "");

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

  const [doctors, setDoctors] = useState([]);
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

  const normalizeForm = (doc = {}) => ({
    name: doc.name ?? "",
    specialization: doc.specialization ?? "",
    experience: doc.experience ?? "",
    fees: doc.fees ?? "",
    contact: doc.contact ?? "",
    email: doc.email ?? "",
  });

  // GET Doctors
  const fetchDoctors = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/doctors/get-doctors`);
      setDoctors(res.data);
    } catch (err) {
      console.error("Failed to fetch doctors", err);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  // Handle Input
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

  // ADD / UPDATE Doctor
  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSaving(true);
    try {
      if (editId) {
        await axios.put(`${API_BASE_URL}/doctors/${editId}`, form);
      } else {
        await axios.post(`${API_BASE_URL}/doctors/create-doctor`, form);
      }

      setForm(emptyForm);
      setEditId(null);
      setShowDialog(false);
      fetchDoctors();
    } catch (err) {
      console.error("Failed to save doctor", err);
      alert("Failed to save doctor. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // DELETE Doctor
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/doctors/${id}`);
      fetchDoctors();
    } catch (err) {
      console.error("Failed to delete doctor", err);
      alert("Failed to delete doctor. Please try again.");
    }
  };

  // EDIT Doctor
  const handleEdit = (doc) => {
    setForm(normalizeForm(doc));
    setEditId(doc._id);
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
          Doctor Management
        </Typography>
        <Button variant="contained" onClick={handleOpenAdd}>
          Add Doctor
        </Button>
      </Stack>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Specialization</TableCell>
              <TableCell>Experience</TableCell>
              <TableCell>Fees</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Email</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {doctors.map((doc) => (
              <TableRow key={doc._id} hover>
                <TableCell>{doc.name}</TableCell>
                <TableCell>{doc.specialization}</TableCell>
                <TableCell>{doc.experience}</TableCell>
                <TableCell>{doc.fees}</TableCell>
                <TableCell>{doc.contact}</TableCell>
                <TableCell>{doc.email}</TableCell>
                <TableCell align="right">
                  <IconButton
                    aria-label="edit"
                    onClick={() => handleEdit(doc)}
                    size="small"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    aria-label="delete"
                    onClick={() => handleDelete(doc._id)}
                    size="small"
                    color="error"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {doctors.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No doctors found
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
  <DialogTitle>{editId ? "Update Doctor" : "Add Doctor"}</DialogTitle>

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

      <FormControl fullWidth required size="small">
        <InputLabel id="doctor-specialization-label">
          Specialization
        </InputLabel>
        <Select
          labelId="doctor-specialization-label"
          label="Specialization"
          name="specialization"
          value={form.specialization}
          onChange={handleChange}
        >
          <MenuItem value="" disabled>
            Select specialization
          </MenuItem>
          {specializationOptions.map((opt) => (
            <MenuItem key={opt} value={opt}>
              {opt}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        label="Experience"
        name="experience"
        size="small"
        value={form.experience}
        onChange={handleChange}
        fullWidth
      />

      <TextField
        label="Fees"
        name="fees"
        size="small"
        value={form.fees}
        onChange={handleChange}
        fullWidth
      />

      <TextField
        label="Contact"
        name="contact"
        size="small"
        value={form.contact}
        onChange={handleChange}
        fullWidth
      />

      <TextField
        label="Email"
        name="email"
        type="email"
        size="small"
        value={form.email}
        onChange={handleChange}
        fullWidth
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
    </Box>
  );
};

export default Doctor;

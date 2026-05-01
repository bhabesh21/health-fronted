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
import Card from "@mui/material/Card";
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
import { ThreeDots } from "react-loader-spinner";
import api from "../../api/api-handler";

export default function Patients() {
  const genderOptions = ["Male", "Female", "Other"];

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

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
      setLoading(true);

      setTimeout(async () => {
        const res = await api.get(`/admin/patients/getall`);
        setPatients(res.data.patients || []);
        setLoading(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to fetch patients", err);
      showToast("Failed to fetch patients.", "error");
      setLoading(false);
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

  // ADD / UPDATE
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload = toPayload();

      if (editId) {
        await api.put(`/admin/patients/update/${editId}`, payload);
        showToast("Patient updated successfully.");
      } else {
        await api.post(`/admin/patients/create`, payload);
        showToast("Patient added successfully.");
      }

      setForm(emptyForm);
      setEditId(null);
      setShowDialog(false);
      fetchPatients();
    } catch (err) {
      console.error(err);
      showToast("Failed to save patient.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // DELETE
  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/patients/delete/${id}`);
      showToast("Patient deleted.");
      fetchPatients();
    } catch (err) {
      console.error(err);
      showToast("Delete failed.", "error");
    }
  };

  const handleEdit = (p) => {
    setForm(normalizeForm(p));
    setEditId(p._id);
    setShowDialog(true);
  };

  return (
    <Box sx={{ px: 2, py: 3 }}>
      {loading ? (
        <Card>
          <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
            <ThreeDots height="80" width="80" color="gray" />
          </Box>
        </Card>
      ) : patients.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center", mt: 3 }}>
          <Typography>No Patients Found</Typography>
          <Button variant="contained" onClick={handleOpenAdd} sx={{ mt: 2 }}>
            Add Patient
          </Button>
        </Paper>
      ) : (
        <div>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="h5">Patient Management</Typography>
            <Button variant="contained" onClick={handleOpenAdd}>
              Add Patient
            </Button>
          </Stack>

          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Age</TableCell>
                  <TableCell>Gender</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Disease</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell  align="right">Action</TableCell>
                </TableRow>  
              </TableHead>  

              <TableBody>
                {patients.map((p) => (
                  <TableRow key={p._id}>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{p.age ?? "-"}</TableCell>
                    <TableCell>{p.gender ?? "-"}</TableCell>
                    <TableCell>{p.phone ?? "-"}</TableCell>
                    <TableCell>{p.disease ?? "-"}</TableCell> 
                    <TableCell>{p.address ?? "-"}</TableCell> 

                    <TableCell align="right">
                      <IconButton onClick={() => handleEdit(p)}>
                        <EditIcon />
                      </IconButton>

                      <IconButton
                        onClick={() => handleDelete(p._id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={showDialog} onClose={handleCloseDialog} fullWidth>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogTitle>{editId ? "Update" : "Add"} Patient</DialogTitle>

          <DialogContent>
            <Stack spacing={2} mt={1}>
              <TextField label="Name" name="name" size="small" value={form.name} onChange={handleChange} fullWidth required />
              <TextField label="Age" name="age" type="number" size="small" value={form.age} onChange={handleChange} fullWidth />

              <FormControl size="small">
                <InputLabel>Gender</InputLabel>
                <Select name="gender" value={form.gender} onChange={handleChange}>
                  {genderOptions.map((g) => (
                    <MenuItem key={g} value={g}>{g}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField label="Phone" name="phone" size="small" value={form.phone} onChange={handleChange} fullWidth />
              <TextField label="Disease" name="disease" size="small" value={form.disease} onChange={handleChange} fullWidth />
              <TextField label="Address" name="address" size="small" value={form.address} onChange={handleChange} fullWidth />
            </Stack>
          </DialogContent>

          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {isSaving ? "Saving..." : "Submit"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* ✅ TOP RIGHT TOAST */}
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
    </Box>
  );
}
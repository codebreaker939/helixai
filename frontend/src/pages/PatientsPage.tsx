import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownUp,
  ChevronLeft,
  ChevronRight,
  Dna,
  Eye,
  Filter,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  UserRound
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { endpoints } from "../lib/api";
import type { Patient, PatientInput } from "../types";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  Modal,
  PageHeader,
  useToast
} from "../components/ui";

const patientSchema = z.object({
  full_name: z.string().min(2, "Enter a full name").max(120),
  age: z.number().int().min(0).max(130),
  gender: z.string().min(1, "Select or enter a gender").max(40),
  disease: z.string().min(2, "Enter a diagnosis or condition").max(160)
});

function PatientForm({
  patient,
  onSubmit,
  submitting
}: {
  patient?: Patient | null;
  onSubmit: (data: PatientInput) => void;
  submitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<PatientInput>({
    resolver: zodResolver(patientSchema),
    defaultValues: patient ?? {
      full_name: "",
      age: 30,
      gender: "",
      disease: ""
    }
  });

  useEffect(() => {
    reset(
      patient ?? {
        full_name: "",
        age: 30,
        gender: "",
        disease: ""
      }
    );
  }, [patient, reset]);

  return (
    <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
      <label className="field field-wide">
        <span>Full name</span>
        <input placeholder="e.g. Maya Carter" {...register("full_name")} autoFocus />
        {errors.full_name && <small>{errors.full_name.message}</small>}
      </label>
      <label className="field">
        <span>Age</span>
        <input type="number" min="0" max="130" {...register("age", { valueAsNumber: true })} />
        {errors.age && <small>{errors.age.message}</small>}
      </label>
      <label className="field">
        <span>Gender</span>
        <input placeholder="e.g. Female" list="gender-options" {...register("gender")} />
        <datalist id="gender-options">
          <option value="Female" />
          <option value="Male" />
          <option value="Non-binary" />
          <option value="Prefer not to say" />
        </datalist>
        {errors.gender && <small>{errors.gender.message}</small>}
      </label>
      <label className="field field-wide">
        <span>Diagnosis / condition</span>
        <input placeholder="e.g. Hypertension" {...register("disease")} />
        {errors.disease && <small>{errors.disease.message}</small>}
      </label>
      <div className="form-actions field-wide">
        <span>All fields are validated by both the interface and FastAPI.</span>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : patient ? "Save changes" : "Create record"}
        </Button>
      </div>
    </form>
  );
}

export function PatientsPage() {
  const queryClient = useQueryClient();
  const notify = useToast();
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<Patient | null>(null);
  const [detail, setDetail] = useState<Patient | null>(null);
  const [deleting, setDeleting] = useState<Patient | null>(null);
  const pageSize = 10;

  const patients = useQuery({
    queryKey: ["patients", search, gender, sortBy, sortOrder, page],
    queryFn: () =>
      endpoints.patients({
        search: search || undefined,
        gender: gender || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        offset: (page - 1) * pageSize,
        limit: pageSize
      })
  });

  const closeForm = () => {
    setFormOpen(false);
    setSelected(null);
  };

  const save = useMutation({
    mutationFn: async (input: PatientInput) =>
      selected
        ? endpoints.updatePatient(selected.id, input)
        : (await endpoints.createPatient(input)).patient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["overview"] });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
      notify(selected ? "Patient record updated" : "Patient record created");
      closeForm();
    },
    onError: (error: Error) => notify(error.message, "error")
  });

  const remove = useMutation({
    mutationFn: (patient: Patient) => endpoints.deletePatient(patient.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["overview"] });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
      notify("Patient record deleted");
      setDeleting(null);
    },
    onError: (error: Error) => notify(error.message, "error")
  });

  const totalPages = Math.max(1, Math.ceil((patients.data?.total ?? 0) / pageSize));

  return (
    <>
      <PageHeader
        eyebrow="Clinical application"
        title="Patient records"
        description="Search, review, and maintain the records exposed by the FastAPI patient service."
      >
        <Button
          onClick={() => {
            setSelected(null);
            setFormOpen(true);
          }}
        >
          <Plus size={16} /> New patient
        </Button>
      </PageHeader>

      <Card className="table-card">
        <div className="table-toolbar">
          <label className="search-box">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search names, diagnosis, or gender"
              aria-label="Search patients"
            />
            {search && (
                <button onClick={() => { setSearch(""); setPage(1); }} aria-label="Clear search">
                ×
              </button>
            )}
          </label>
          <div className="toolbar-filters">
            <label className="select-wrap">
              <Filter size={15} />
              <select value={gender} onChange={(event) => { setGender(event.target.value); setPage(1); }}>
                <option value="">All genders</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </label>
            <label className="select-wrap">
              <SlidersHorizontal size={15} />
              <select value={sortBy} onChange={(event) => { setSortBy(event.target.value); setPage(1); }}>
                <option value="id">Record ID</option>
                <option value="full_name">Name</option>
                <option value="age">Age</option>
                <option value="disease">Diagnosis</option>
                <option value="gender">Gender</option>
              </select>
            </label>
            <button
              className="icon-button"
              onClick={() => { setSortOrder((value) => (value === "asc" ? "desc" : "asc")); setPage(1); }}
              title={`Sort ${sortOrder === "asc" ? "descending" : "ascending"}`}
            >
              <ArrowDownUp size={17} />
            </button>
          </div>
        </div>

        {patients.isLoading ? (
          <LoadingState label="Loading clinical records" />
        ) : patients.isError ? (
          <ErrorState message={patients.error.message} retry={() => patients.refetch()} />
        ) : patients.data!.items.length === 0 ? (
          <EmptyState
            title={search || gender ? "No matching patients" : "No patient records yet"}
            description={
              search || gender
                ? "Adjust the search or filters to broaden the results."
                : "Create the first record to verify the patient API workflow."
            }
          />
        ) : (
          <>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Record ID</th>
                    <th>Age</th>
                    <th>Gender</th>
                    <th>Diagnosis / condition</th>
                    <th className="align-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.data!.items.map((patient) => (
                    <tr key={patient.id}>
                      <td>
                        <div className="patient-cell">
                          <span className="patient-avatar">
                            {patient.full_name
                              .split(" ")
                              .slice(0, 2)
                              .map((part) => part[0])
                              .join("")
                              .toUpperCase()}
                          </span>
                          <div>
                            <strong>{patient.full_name}</strong>
                            <span>Clinical record</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <code>HX-{String(patient.id).padStart(5, "0")}</code>
                      </td>
                      <td>{patient.age}</td>
                      <td>{patient.gender}</td>
                      <td>
                        <span className="diagnosis-tag">{patient.disease}</span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button onClick={() => setDetail(patient)} aria-label="View patient">
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setSelected(patient);
                              setFormOpen(true);
                            }}
                            aria-label="Edit patient"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="danger"
                            onClick={() => setDeleting(patient)}
                            aria-label="Delete patient"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-footer">
              <span>
                Showing {(page - 1) * pageSize + 1}–
                {Math.min(page * pageSize, patients.data!.total)} of {patients.data!.total} records
              </span>
              <div className="pagination">
                <button
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  disabled={page === 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>
                <span>
                  Page <strong>{page}</strong> of {totalPages}
                </span>
                <button
                  onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                  disabled={page === totalPages}
                  aria-label="Next page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </Card>

      <div className="data-note">
        <Dna size={17} />
        <div>
          <strong>Live PostgreSQL data</strong>
          <span>
            Every row on this page is loaded from the FastAPI patient endpoints. No sample records
            are generated by the frontend.
          </span>
        </div>
      </div>

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={selected ? "Edit patient record" : "Create patient record"}
        description={
          selected
            ? `Updating HX-${String(selected.id).padStart(5, "0")}`
            : "Add a validated record to the HelixAI clinical data service."
        }
      >
        <PatientForm
          patient={selected}
          onSubmit={(data) => save.mutate(data)}
          submitting={save.isPending}
        />
      </Modal>

      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title="Patient record"
        description={detail ? `HX-${String(detail.id).padStart(5, "0")}` : undefined}
      >
        {detail && (
          <div className="patient-detail">
            <div className="detail-identity">
              <span className="patient-avatar large">
                <UserRound size={25} />
              </span>
              <div>
                <h3>{detail.full_name}</h3>
                <span>Stored clinical profile</span>
              </div>
            </div>
            <dl>
              <div>
                <dt>Age</dt>
                <dd>{detail.age} years</dd>
              </div>
              <div>
                <dt>Gender</dt>
                <dd>{detail.gender}</dd>
              </div>
              <div>
                <dt>Diagnosis / condition</dt>
                <dd>{detail.disease}</dd>
              </div>
              <div>
                <dt>Source</dt>
                <dd>PostgreSQL via FastAPI</dd>
              </div>
            </dl>
            <Button
              onClick={() => {
                setSelected(detail);
                setDetail(null);
                setFormOpen(true);
              }}
            >
              <Pencil size={15} /> Edit record
            </Button>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete patient record?"
        description="This removes the record from PostgreSQL and cannot be undone."
      >
        <div className="confirm-body">
          <div className="confirm-target">
            <Trash2 size={20} />
            <div>
              <strong>{deleting?.full_name}</strong>
              <span>HX-{String(deleting?.id ?? 0).padStart(5, "0")}</span>
            </div>
          </div>
          <div className="confirm-actions">
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => deleting && remove.mutate(deleting)}
              disabled={remove.isPending}
            >
              {remove.isPending ? "Deleting…" : "Delete record"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

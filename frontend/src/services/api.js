const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "");

function getToken() {
  return localStorage.getItem("token");
}

async function request(path, options = {}) {
  const token = getToken();
  const url = `${API_BASE_URL}${path}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch {
    throw new Error("Could not reach the API server. Make sure the backend was restarted and is running on port 5000.");
  }

  const text = await response.text();
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") && text ? JSON.parse(text) : null;

  if (text && !data && contentType.includes("text/html")) {
    throw new Error(`The API request to ${url} returned an HTML page. Restart the frontend dev server and make sure the backend is running on port 5000.`);
  }

  if (!response.ok) {
    throw new Error(data?.message || data?.error || `Request failed with status ${response.status}`);
  }

  return data;
}

const crudApi = (resource) => ({
  getAll: () => request(resource),
  getById: (id) => request(`${resource}/${id}`),
  create: (data) => request(resource, {
    method: "POST",
    body: JSON.stringify(data),
  }),
  update: (id, data) => request(`${resource}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }),
  delete: (id) => request(`${resource}/${id}`, {
    method: "DELETE",
  }),
});

export const authApi = {
  login: (credentials) => request("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  }),
  register: (userData) => request("/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  }),
  me: () => request("/auth/me"),
  logout: () => request("/auth/logout", { method: "POST" }),
};

export const coursesApi = {
  ...crudApi("/courses"),
  getAll: (department) => {
    const query = department ? `?department=${encodeURIComponent(department)}` : "";
    return request(`/courses${query}`);
  },
  assignProfessor: (id, professor) => request(`/courses/${id}/assign`, {
    method: "PATCH",
    body: JSON.stringify({ professor }),
  }),
  create: (data) => request("/courses", {
    method: "POST",
    body: JSON.stringify({
      ...data,
      creditHours: data.creditHours === undefined || data.creditHours === ""
        ? undefined
        : Number(data.creditHours),
    }),
  }),
  update: (id, data) => request(`/courses/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      ...data,
      creditHours: data.creditHours === undefined || data.creditHours === ""
        ? undefined
        : Number(data.creditHours),
    }),
  }),
};

export const staffApi = {
  getAll: (role) => {
    const query = role ? `?role=${encodeURIComponent(role)}` : "";
    return request(`/staff${query}`);
  },
  create: (data) => request("/staff", {
    method: "POST",
    body: JSON.stringify(data),
  }),
};

export const assignmentsApi = {
  getAll: () => request("/assignments"),
  create: (data) => request("/assignments", {
    method: "POST",
    body: JSON.stringify({
      title: data.title,
      description: data.description,
      courseId: data.courseId,
      courseCode: data.courseCode,
      dueDate: data.dueDate,
      weightage: data.weightage || 10,
    }),
  }),
  update: (id, data) => request(`/assignments/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      title: data.title,
      description: data.description,
      courseId: data.courseId,
      courseCode: data.courseCode,
      dueDate: data.dueDate,
      weightage: data.weightage,
    }),
  }),
  delete: (id) => request(`/assignments/${id}`, { method: "DELETE" }),
  getSubmissions: (assignmentId) => request(`/assignments/submissions${assignmentId ? `?assignmentId=${assignmentId}` : ""}`),
  submit: (data) => request("/assignments/submissions", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  gradeSubmission: (id, data) => request(`/assignments/submissions/${id}/grade`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }),
};

export const discussionsApi = {
  ...crudApi("/discussions"),
  reply: (id, data) => request(`/discussions/${id}/reply`, {
    method: "POST",
    body: JSON.stringify(data),
  }),
};

export const officeHoursApi = crudApi("/office-hours");

export const meetingsApi = {
  ...crudApi("/meetings"),
  updateStatus: (id, status) => request(`/meetings/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  }),
};

export const announcementsApi = {
  getAll: () => request("/announcements"),
  create: (data) => request("/announcements", {
    method: "POST",
    body: JSON.stringify({
      title: data.title,
      content: data.content,
      courseId: data.courseId || null,
      location: data.location || "",
      date: data.date,
      time: data.time || "",
      pinned: Boolean(data.pinned),
      cancelled: Boolean(data.cancelled),
    }),
  }),
  update: (id, data) => request(`/announcements/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      title: data.title,
      content: data.content,
      courseId: data.courseId || null,
      location: data.location,
      date: data.date,
      time: data.time || "",
      pinned: data.pinned,
      cancelled: Boolean(data.cancelled),
    }),
  }),
  delete: (id) => request(`/announcements/${id}`, { method: "DELETE" }),
};

export const messagesApi = {
  getAll: () => request("/messages"),
  send: (data) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const sender = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Unknown";

    return request("/messages", {
      method: "POST",
      body: JSON.stringify({
        from: sender,
        to: data.recipient,
        subject: data.subject,
        content: data.content,
      }),
    });
  },
  markAsRead: (id) => request(`/messages/${id}/read`, { method: "PATCH" }),
  delete: (id) => request(`/messages/${id}`, { method: "DELETE" }),
};

export const roomBookingsApi = {
  getAll: () => request("/room-bookings"),
  getAvailable: (date, startTime) => request(`/room-bookings/available?date=${date}&startTime=${startTime}`),
  create: (data) => request("/room-bookings", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  cancel: (id) => request(`/room-bookings/${id}/cancel`, { method: "PATCH" }),
  delete: (id) => request(`/room-bookings/${id}`, { method: "DELETE" }),
};

export const roomsApi = {
  getAll: () => request("/rooms"),
  create: (data) => request("/rooms", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  update: (id, data) => request(`/rooms/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }),
  delete: (id) => request(`/rooms/${id}`, { method: "DELETE" }),
};

export const applicationsApi = {
  getAll: (status) => {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    return request(`/applications${query}`);
  },
  getById: (id) => request(`/applications/${id}`),
  create: (data) => request("/applications", {
    method: "POST",
    body: JSON.stringify(data),
  }),
};

export const leaveRequestsApi = {
  getAll: () => request("/leave-requests"),
  getById: (id) => request(`/leave-requests/${id}`),
  create: (data) => request("/leave-requests", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  updateStatus: (id, status, reviewNotes) => request(`/leave-requests/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, reviewNotes }),
  }),
  delete: (id) => request(`/leave-requests/${id}`, { method: "DELETE" }),
};

export const payrollApi = {
  getAll: () => request("/payroll"),
  getCurrent: () => request("/payroll/current"),
  create: (data) => request("/payroll", {
    method: "POST",
    body: JSON.stringify(data),
  }),
};

export const parentApi = {
  getChild: () => request("/parent/child"),
  getChildCourses: () => request("/parent/child/courses"),
  getInstructors: () => request("/parent/instructors"),
};


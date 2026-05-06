const apiUrl = import.meta.env.VITE_API_URL;

async function handleResponse(res) {
  const text = await res.text();
  try {
    const json = text ? JSON.parse(text) : null;
    if (!res.ok) throw { status: res.status, body: json || text };
    return json;
  } catch (err) {
    if (!res.ok) throw { status: res.status, body: text };
    return text;
  }
}

export async function listQuizzes(token) {
  const res = await fetch(`${apiUrl}/quiz/fetchAll`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  console.log(token);
  return handleResponse(res);
}

// Public list for select inputs — normalizes to { value, label }
export async function listQuizzesForSelect(token) {
  console.log(token);
  const res = await fetch(`${apiUrl}/quiz/fetchAll`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await handleResponse(res);
  const arr = Array.isArray(data)
    ? data
    : data && Array.isArray(data.data)
    ? data.data
    : [];
  return arr
    .map((item) => {
      if (!item) return null;
      if (typeof item === "string") return { value: item, label: item };
      const title = (
        item.title ||
        item.label ||
        item.name ||
        item.value ||
        (item.id ? String(item.id) : "")
      ).toString();
      return { value: title, label: title, raw: item };
    })
    .filter(Boolean);
}

export async function getQuiz(id, token) {
  console.log(id);
  const res = await fetch(`${apiUrl}/quiz/getQuizAdm/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return handleResponse(res);
}

export async function createQuiz(payload, token) {
  const res = await fetch(`${apiUrl}/quiz/create`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function deleteQuiz(id, token) {
  const res = await fetch(`${apiUrl}/quiz/${id}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return handleResponse(res);
}

export async function listDepartments(token) {
  const res = await fetch(`${apiUrl}/meta/departments`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await handleResponse(res); // consume body once
  console.log("Departments response:", data);
  // If API wraps result in { success: true, data: [...] } return the inner array
  return data && typeof data === "object" && Array.isArray(data.data)
    ? data.data
    : data;
}

export async function importQuizFromJson(payload, token) {
  console.log(token);
  const res = await fetch(`${apiUrl}/quiz/import/json`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function importQuizFromFile(file, token) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${apiUrl}/quiz/import/file`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // DO NOT set content-type here, browser will set multipart boundary
    },
    body: formData,
  });

  return handleResponse(res);
}

export async function updateQuiz(id, payload, token) {
  const res = await fetch(`${apiUrl}/quiz/${id}`, {
    method: "PUT",
    headers: {
      "content-type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export default {
  listQuizzes,
  getQuiz,
  createQuiz,
  deleteQuiz,
  listDepartments,
  listQuizzesForSelect,
  importQuizFromFile,
  importQuizFromJson,
  updateQuiz,
};

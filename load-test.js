/**
 * GovGuide Load Test — 10,000 users
 *
 * Creates 10,000 users, each starts 1-3 service tasks with 4-5 checklist items updated,
 * submits feedback and reviews. Verifies admin dashboard data after.
 *
 * Usage: node load-test.js [base-url]
 * Default: http://localhost:8080
 */

const BASE = process.argv[2] || "http://localhost:8080";
const API = `${BASE}/api/v1`;
const TOTAL_USERS = 10000;
const BATCH_SIZE = 50; // concurrent registrations per batch

const SERVICES = [
  "AADHAAR_NEW_ENROLLMENT", "AADHAAR_UPDATE", "PAN_CARD_APPLICATION",
  "PASSPORT_NEW", "DRIVING_LICENSE_NEW", "VOTER_ID_REGISTRATION",
  "BIRTH_CERTIFICATE_REGISTRATION", "DEATH_CERTIFICATE_REGISTRATION",
  "MARRIAGE_CERTIFICATE", "RATION_CARD_NEW", "DOMICILE_CERTIFICATE",
  "CASTE_CERTIFICATE", "INCOME_CERTIFICATE", "GST_REGISTRATION",
  "FSSAI_LICENSE", "MSME_REGISTRATION", "PROPERTY_REGISTRATION",
  "ARMS_LICENSE", "RTI_APPLICATION", "AYUSHMAN_BHARAT_PMJAY",
  "EPF_WITHDRAWAL", "APPRENTICESHIP_REGISTRATION", "WATER_CONNECTION_NEW",
  "ELECTRICITY_CONNECTION_NEW", "BUILDING_PLAN_APPROVAL"
];

const FEEDBACK_TYPES = ["BUG", "INCORRECT_INFO", "MISSING_INFO", "SUGGESTION", "OTHER"];
const FEEDBACK_MESSAGES = [
  "The document list seems incomplete for my state.",
  "Processing time shown is outdated, it took much longer.",
  "Would be helpful to have offline checklist support.",
  "Great tool! Helped me understand the process better.",
  "The fee information doesn't match the official website.",
  "Could you add links to download forms directly?",
  "The official link is broken, please update.",
  "Excellent service guide, very detailed requirements.",
  "Missing information about online vs offline application mode.",
  "Would love to see estimated wait times at government offices.",
];

const REVIEW_MESSAGES = [
  "Very helpful for tracking documents. Saved me multiple trips to the office.",
  "Good guide but some information was slightly outdated.",
  "Excellent! The checklist feature is really useful.",
  "Decent tool. Wish it had more detailed step-by-step instructions.",
  "Amazing resource. I completed my application in one visit.",
  "The requirements list was accurate and complete.",
  "Helpful but could use more regional-specific information.",
  "Best government service guide I've used. Clean and organized.",
  "Some services need more detail, but overall very good.",
  "Saved me hours of research. Highly recommended.",
];

const STATES = [
  "Tamil Nadu", "Karnataka", "Maharashtra", "Delhi", "Uttar Pradesh",
  "Kerala", "Telangana", "West Bengal", "Gujarat", "Rajasthan",
  "Andhra Pradesh", "Madhya Pradesh", "Bihar", "Punjab", "Odisha",
];

let stats = {
  usersCreated: 0,
  usersFailed: 0,
  tasksCreated: 0,
  checklistUpdates: 0,
  feedbackSubmitted: 0,
  reviewsSubmitted: 0,
  errors: [],
};

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function authHeader(user) { return "Basic " + Buffer.from(`${user}:Test1234`).toString("base64"); }

async function fetchJSON(url, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", ...opts.headers },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${url}: ${text.substring(0, 100)}`);
  }
  return res.json();
}

async function registerUser(username) {
  return fetchJSON(`${API}/auth/register`, {
    method: "POST",
    body: JSON.stringify({ username, password: "Test1234" }),
  });
}

async function createTask(serviceCode, auth) {
  return fetchJSON(`${API}/tasks`, {
    method: "POST",
    headers: { Authorization: auth },
    body: JSON.stringify({
      serviceCode,
      context: { "workflow.selectedServiceRoute": serviceCode, "user.state": pick(STATES) },
    }),
  });
}

async function updateChecklist(taskId, itemId, state, auth) {
  return fetchJSON(`${API}/tasks/${taskId}/checklist-items/${itemId}`, {
    method: "PATCH",
    headers: { Authorization: auth },
    body: JSON.stringify({ state }),
  });
}

async function submitFeedback(serviceCode, auth) {
  return fetchJSON(`${API}/feedback`, {
    method: "POST",
    headers: { Authorization: auth },
    body: JSON.stringify({
      serviceCode,
      type: pick(FEEDBACK_TYPES),
      message: pick(FEEDBACK_MESSAGES),
    }),
  });
}

async function submitReview(serviceCode, taskId, auth) {
  return fetchJSON(`${API}/reviews`, {
    method: "POST",
    headers: { Authorization: auth },
    body: JSON.stringify({
      serviceCode,
      taskId,
      rating: randInt(1, 5),
      message: pick(REVIEW_MESSAGES),
    }),
  });
}

async function simulateUser(index) {
  const username = `loaduser${String(index).padStart(5, "0")}`;
  const auth = authHeader(username);

  try {
    await registerUser(username);
    stats.usersCreated++;
  } catch (e) {
    if (!e.message.includes("409")) {
      stats.usersFailed++;
      if (stats.errors.length < 20) stats.errors.push(`Register ${username}: ${e.message}`);
      return;
    }
    stats.usersCreated++; // already exists from prior run
  }

  const numTasks = randInt(1, 3);
  const usedServices = new Set();

  for (let t = 0; t < numTasks; t++) {
    let serviceCode;
    do { serviceCode = pick(SERVICES); } while (usedServices.has(serviceCode));
    usedServices.add(serviceCode);

    try {
      const result = await createTask(serviceCode, auth);
      const task = result.data || result;
      stats.tasksCreated++;

      if (task.checklistStates) {
        const items = Object.keys(task.checklistStates);
        const numUpdates = Math.min(randInt(4, 5), items.length);
        const states = ["AVAILABLE", "IN_PROGRESS", "COMPLETED", "COMPLETED", "COMPLETED"];

        for (let i = 0; i < numUpdates; i++) {
          try {
            await updateChecklist(task.taskId, items[i], pick(states), auth);
            stats.checklistUpdates++;
          } catch {}
        }
      }

      // 30% chance of feedback per task
      if (Math.random() < 0.3) {
        try {
          await submitFeedback(serviceCode, auth);
          stats.feedbackSubmitted++;
        } catch {}
      }

      // 20% chance of review per task
      if (Math.random() < 0.2) {
        try {
          await submitReview(serviceCode, task.taskId, auth);
          stats.reviewsSubmitted++;
        } catch {}
      }
    } catch (e) {
      if (stats.errors.length < 20) stats.errors.push(`Task ${username}/${serviceCode}: ${e.message}`);
    }
  }
}

async function runBatch(startIndex, count) {
  const promises = [];
  for (let i = startIndex; i < startIndex + count && i < TOTAL_USERS; i++) {
    promises.push(simulateUser(i));
  }
  await Promise.all(promises);
}

async function main() {
  console.log(`GovGuide Load Test — ${TOTAL_USERS} users`);
  console.log(`Target: ${BASE}`);
  console.log(`Batch size: ${BATCH_SIZE} concurrent\n`);

  // Check server is up
  try {
    await fetchJSON(`${API}/health`);
    console.log("Server is healthy. Starting load test...\n");
  } catch (e) {
    console.error(`Server not reachable at ${BASE}: ${e.message}`);
    process.exit(1);
  }

  const start = Date.now();

  for (let batch = 0; batch < TOTAL_USERS; batch += BATCH_SIZE) {
    const batchNum = Math.floor(batch / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(TOTAL_USERS / BATCH_SIZE);
    await runBatch(batch, BATCH_SIZE);

    if (batchNum % 10 === 0 || batchNum === totalBatches) {
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      const pct = ((batch + BATCH_SIZE) / TOTAL_USERS * 100).toFixed(0);
      console.log(`[${elapsed}s] Batch ${batchNum}/${totalBatches} (${pct}%) — Users: ${stats.usersCreated}, Tasks: ${stats.tasksCreated}, Feedback: ${stats.feedbackSubmitted}, Reviews: ${stats.reviewsSubmitted}`);
    }
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  console.log(`\n${"=".repeat(60)}`);
  console.log(`LOAD TEST COMPLETE — ${elapsed}s`);
  console.log(`${"=".repeat(60)}`);
  console.log(`Users created:       ${stats.usersCreated}`);
  console.log(`Users failed:        ${stats.usersFailed}`);
  console.log(`Tasks created:       ${stats.tasksCreated}`);
  console.log(`Checklist updates:   ${stats.checklistUpdates}`);
  console.log(`Feedback submitted:  ${stats.feedbackSubmitted}`);
  console.log(`Reviews submitted:   ${stats.reviewsSubmitted}`);

  if (stats.errors.length > 0) {
    console.log(`\nSample errors (${stats.errors.length}):`);
    stats.errors.forEach(e => console.log(`  - ${e}`));
  }

  // Verify admin data
  console.log(`\n--- Verifying Admin Dashboard Data ---`);
  try {
    const adminAuth = authHeader("loaduser00000");
    const adminStats = await fetchJSON(`${API}/admin/stats`, { headers: { Authorization: adminAuth } });
    const data = adminStats.data || adminStats;
    console.log(`Total users (admin):     ${data.totalUsers}`);
    console.log(`Total tasks (admin):     ${data.totalTasks}`);
    console.log(`Completed tasks (admin): ${data.completedTasks}`);
    console.log(`Total feedback (admin):  ${data.totalFeedback}`);
    console.log(`Total reviews (admin):   ${data.totalReviews}`);
    console.log(`Average rating (admin):  ${data.averageRating}/5`);
    if (data.topServices?.length > 0) {
      console.log(`\nTop 10 most used services:`);
      data.topServices.slice(0, 10).forEach((s, i) =>
        console.log(`  ${i + 1}. ${s.serviceCode} — ${s.taskCount} tasks`)
      );
    }
    if (data.feedbackByType) {
      console.log(`\nFeedback by type:`);
      Object.entries(data.feedbackByType).forEach(([type, count]) =>
        console.log(`  ${type}: ${count}`)
      );
    }
  } catch (e) {
    console.log(`Admin verification failed: ${e.message}`);
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Test complete. Open http://localhost:3000/admin to see the dashboard.`);
}

main().catch(console.error);

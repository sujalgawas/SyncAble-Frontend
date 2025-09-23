import React, { useState, useContext, useEffect } from "react";
import {
  Card,
  Form,
  Button,
  ListGroup,
  Row,
  Col,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { TimetableContext } from "../context/TimetableContext";
import Timetable from "../components/common/Timetable";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { timetable, setTimetable, TIMESLOTS } = useContext(TimetableContext);

  // Teacher identity (in real app comes from auth)
  const [teacherName] = useState("Prof. Jane Smith");

  // Subjects the teacher can teach: [{ name: "DBMS", hours: 2 }, ...]
  const [subjects, setSubjects] = useState(() => {
    try {
      const raw = localStorage.getItem("teacher_subjects");
      return raw ? JSON.parse(raw) : [{ name: "DBMS", hours: 2 }];
    } catch {
      return [{ name: "DBMS", hours: 2 }];
    }
  });
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectHours, setNewSubjectHours] = useState(1);

  // Availability keyed by timeslot string, true = available at that timeslot (any day)
  const [availability, setAvailability] = useState(() => {
    const map = {};
    (TIMESLOTS || []).forEach((t) => (map[t] = false));
    return map;
  });

  const [notifications, setNotifications] = useState([]);

  // Ensure availability gets initialized if TIMESLOTS becomes available later
  useEffect(() => {
    if (!TIMESLOTS) return;
    setAvailability((prev) => {
      const next = {};
      TIMESLOTS.forEach((t) => {
        next[t] = prev[t] ?? false;
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [TIMESLOTS]);

  // Persist subjects locally for dev convenience
  useEffect(() => {
    try {
      localStorage.setItem("teacher_subjects", JSON.stringify(subjects));
    } catch {}
  }, [subjects]);

  const handleLogout = () => navigate("/");

  const addSubject = (e) => {
    e.preventDefault();
    const name = newSubjectName.trim();
    const hours = Number(newSubjectHours) || 0;
    if (!name) {
      alert("Enter subject name.");
      return;
    }
    if (hours <= 0) {
      alert("Hours must be at least 1 (weekly sessions).");
      return;
    }
    setSubjects((prev) => [...prev, { name, hours }]);
    setNewSubjectName("");
    setNewSubjectHours(1);
  };

  const removeSubject = (index) => {
    setSubjects((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleAvailability = (slot) => {
    setAvailability((prev) => ({ ...prev, [slot]: !prev[slot] }));
  };

  // Helper: build a fresh empty timetable structure if needed
  const makeEmptyTimetable = () => {
    const slotCount = (TIMESLOTS && TIMESLOTS.length) || 0;
    const build = {};
    DAYS.forEach((d) => {
      build[d] = Array(slotCount).fill("");
    });
    return build;
  };

  // Main: improved assignment logic
  const handleGenerateTimetable = () => {
    if (!subjects.length) {
      alert("Add at least one subject first.");
      return;
    }
    if (!TIMESLOTS || TIMESLOTS.length === 0) {
      alert("Timeslots not configured.");
      return;
    }

    // Clone or create timetable
    const newTimetable = {};
    if (timetable && DAYS.every((d) => Array.isArray(timetable[d]))) {
      DAYS.forEach((d) => (newTimetable[d] = [...timetable[d]]));
    } else {
      Object.assign(newTimetable, makeEmptyTimetable());
    }

    const assignments = [];
    const shortages = [];

    // For each subject allocate 'hours' sessions across days & timeslots (earliest-first)
    for (const subj of subjects) {
      let sessionsNeeded = Number(subj.hours) || 0;

      for (let dayIdx = 0; dayIdx < DAYS.length && sessionsNeeded > 0; dayIdx++) {
        const day = DAYS[dayIdx];

        for (let slotIdx = 0; slotIdx < TIMESLOTS.length && sessionsNeeded > 0; slotIdx++) {
          const slotLabel = TIMESLOTS[slotIdx];

          // Skip lunch-like slot if your timeslot string contains '12:00' or lunch you added
          if (slotLabel.toLowerCase().includes("12:00") && slotLabel.toLowerCase().includes("01:00")) {
            continue;
          }

          // teacher must be available at that timeslot (same time all days)
          if (!availability[slotLabel]) continue;

          // slot must be currently empty
          if (!newTimetable[day][slotIdx]) {
            newTimetable[day][slotIdx] = subj.name; // storing subject string; change if you want object
            assignments.push(`${subj.name} -> ${day} ${slotLabel} (slot ${slotIdx})`);
            sessionsNeeded--;
          }
        }
      }

      if (sessionsNeeded > 0) {
        shortages.push({ subject: subj.name, missing: sessionsNeeded });
      }
    }

    // Persist updated shared timetable
    setTimetable(newTimetable);

    // Notifications
    if (assignments.length > 0) {
      setNotifications((prev) => [
        `✅ Assigned ${assignments.length} slot(s): ${assignments.join("; ")}`,
        ...assignments.map((a) => a),
        ...prev,
      ]);
    }
    if (shortages.length > 0) {
      const msgs = shortages.map((s) => `⚠️ Could not schedule ${s.missing} session(s) for ${s.subject}`);
      setNotifications((prev) => [...msgs, ...prev]);
    }
    if (assignments.length === 0 && shortages.length === 0) {
      setNotifications((prev) => ["No assignments made.", ...prev]);
    }
  };

  const clearAvailability = () => {
    const reset = {};
    (TIMESLOTS || []).forEach((t) => (reset[t] = false));
    setAvailability(reset);
  };

  return (
    <div className="container my-5">
      <h2 className="mb-4 text-center">Welcome, {teacherName}</h2>

      <Row className="mb-4">
        <Col md={6}>
          <Card className="mb-3">
            <Card.Header>
              <h5>📚 Your Subjects</h5>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush" className="mb-3">
                {subjects.length === 0 && <ListGroup.Item>No subjects added yet.</ListGroup.Item>}
                {subjects.map((s, idx) => (
                  <ListGroup.Item key={idx} className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{s.name}</strong>{" "}
                      <span className="text-muted">({s.hours} session(s)/week)</span>
                    </div>
                    <Button size="sm" variant="outline-danger" onClick={() => removeSubject(idx)}>
                      Remove
                    </Button>
                  </ListGroup.Item>
                ))}
              </ListGroup>

              <Form onSubmit={addSubject}>
                <Row className="g-2">
                  <Col xs={6}>
                    <Form.Control
                      placeholder="Subject name (e.g., DBMS)"
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
                    />
                  </Col>
                  <Col xs={4}>
                    <Form.Control
                      type="number"
                      min={1}
                      placeholder="Weekly sessions"
                      value={newSubjectHours}
                      onChange={(e) => setNewSubjectHours(e.target.value)}
                    />
                  </Col>
                  <Col xs={2}>
                    <Button type="submit" variant="success" size="sm" className="w-100 text-nowrap" style={{ padding: "11px" }}>
                      Add
                    </Button>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card>
            <Card.Header>
              <h5>📌 Your Availability (select times you can teach)</h5>
            </Card.Header>
            <Card.Body>
              <Form>
                <Row>
                  {(TIMESLOTS || []).map((slot) => (
                    <Col xs={6} md={12} key={slot} className="mb-2">
                      <Form.Check
                        type="checkbox"
                        id={`avail-${slot}`}
                        label={slot}
                        checked={availability[slot] || false}
                        onChange={() => toggleAvailability(slot)}
                      />
                    </Col>
                  ))}
                </Row>
              </Form>

              <div className="mt-3">
                <Button variant="primary" onClick={handleGenerateTimetable} className="me-2">
                  Generate Timetable
                </Button>
                <Button variant="outline-secondary" onClick={clearAvailability}>
                  Clear Availability
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="mb-4">
        <Card.Header>
          <h5>📅 Current Shared Timetable</h5>
        </Card.Header>
        <Card.Body>
          {/* Timetable component expects the context timetable shape (Mon..Fri arrays) */}
          <Timetable customTimetable={timetable} title={`${teacherName}-timetable`} />
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header>
          <h5>🔔 Notifications</h5>
        </Card.Header>
        <ListGroup variant="flush">
          {notifications.length === 0 && <ListGroup.Item>No notifications yet</ListGroup.Item>}
          {notifications.map((note, idx) => (
            <ListGroup.Item key={idx}>{note}</ListGroup.Item>
          ))}
        </ListGroup>
      </Card>

      <div className="mb-5 text-center">
        <Button variant="danger" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </div>
  );
};

export default TeacherDashboard;

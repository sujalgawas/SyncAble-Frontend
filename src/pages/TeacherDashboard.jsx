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

  const [teacherName, setTeacherName] = useState("Prof. Jane Smith");

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

  const [availability, setAvailability] = useState(() => {
    const map = {};
    TIMESLOTS.forEach((t) => (map[t] = false));
    return map;
  });

  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    localStorage.setItem("teacher_subjects", JSON.stringify(subjects));
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

  const handleGenerateTimetable = () => {
    if (!subjects.length) {
      alert("Add at least one subject first.");
      return;
    }

    const newTimetable = {
      Mon: [...timetable.Mon],
      Tue: [...timetable.Tue],
      Wed: [...timetable.Wed],
      Thu: [...timetable.Thu],
      Fri: [...timetable.Fri],
    };

    const availableSlots = [];
    DAYS.forEach((day) => {
      TIMESLOTS.forEach((slot, idx) => {
        if (slot.toLowerCase().includes("12:00")) return; // skip lunch
        if (!availability[slot]) return;
        if (newTimetable[day][idx] === "") availableSlots.push({ day, idx, slot });
      });
    });

    if (availableSlots.length === 0) {
      alert("No available slots selected. Mark availability first.");
      return;
    }

    const assignments = [];
    let slotPointer = 0;

    for (const subj of subjects) {
      let sessionsNeeded = Number(subj.hours) || 0;
      while (sessionsNeeded > 0 && slotPointer < availableSlots.length) {
        const { day, idx } = availableSlots[slotPointer];
        if (newTimetable[day][idx] === "") {
          newTimetable[day][idx] = subj.name;
          assignments.push(`${subj.name} -> ${day} ${TIMESLOTS[idx]}`);
          sessionsNeeded--;
        }
        slotPointer++;
      }

      if (sessionsNeeded > 0) {
        setNotifications((prev) => [
          `⚠️ Could not schedule ${sessionsNeeded} session(s) for ${subj.name} (not enough free available slots).`,
          ...prev,
        ]);
      }
    }

    setTimetable(newTimetable);

    if (assignments.length > 0) {
      setNotifications((prev) => [
        `✅ Assigned ${assignments.length} slot(s): ${assignments.join("; ")}`,
        ...prev,
      ]);
      assignments.slice(0, 6).forEach((a) => {
        setNotifications((prev) => [a, ...prev]);
      });
    } else {
      setNotifications((prev) => [`No assignments made.`, ...prev]);
    }
  };

  return (
    <div className="container my-5">
      <h2 className="mb-4">Welcome, {teacherName}</h2>

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
                      <strong>{s.name}</strong> <span className="text-muted">({s.hours} session(s)/week)</span>
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
                  {TIMESLOTS.map((slot) => (
                    <Col xs={6} md={12} key={slot} className="mb-2">
                      <Form.Check
                        type="checkbox"
                        id={`avail-${slot}`}
                        label={slot}
                        checked={availability[slot]}
                        onChange={() => toggleAvailability(slot)}
                      />
                    </Col>
                  ))}
                </Row>
              </Form>

              <div className="mt-3">
                <Button variant="primary" onClick={handleGenerateTimetable}>
                  Generate Timetable
                </Button>{" "}
                <Button
                  variant="outline-secondary"
                  onClick={() => {
                    const reset = {};
                    TIMESLOTS.forEach((t) => (reset[t] = false));
                    setAvailability(reset);
                  }}
                >
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

      <div className="mb-5">
        <Button variant="danger" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </div>
  );
};

export default TeacherDashboard;

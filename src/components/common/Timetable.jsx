// src/components/common/Timetable.jsx
import React from "react";

const Timetable = ({ timetable }) => {
  if (!timetable || timetable.length === 0) {
    return <p className="text-center mt-4">No timetable available.</p>;
  }

  // Export timetable to CSV
  const exportToCSV = () => {
    const headers = ["Day", "Time", "Subject", "Teacher", "Classroom"];
    const rows = timetable.map((entry) => [
      entry.day,
      entry.time,
      entry.subject,
      entry.teacher,
      entry.classroom,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map((row) => row.join(",")).join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "timetable.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mt-4">
      <h3 className="text-center">📅 Timetable</h3>
      <div className="text-end mb-3">
        <button onClick={exportToCSV} className="btn btn-success">
          Export Timetable
        </button>
      </div>

      <table className="table table-bordered text-center">
        <thead className="table-dark">
          <tr>
            <th>Day</th>
            <th>Time</th>
            <th>Subject</th>
            <th>Teacher</th>
            <th>Classroom</th>
          </tr>
        </thead>
        <tbody>
          {timetable.map((entry, index) => (
            <tr key={index}>
              <td>{entry.day}</td>
              <td>{entry.time}</td>
              <td>{entry.subject}</td>
              <td>{entry.teacher}</td>
              <td>{entry.classroom}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Timetable;

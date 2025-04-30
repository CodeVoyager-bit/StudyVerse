
'use client'

import { useState } from 'react'
import styles from './page.module.css'

export default function GPACalculator() {
  const [semesters, setSemesters] = useState([{
    courses: [{ credits: '', grade: '' }],
    sgpa: null
  }])
  const [cgpa, setCGPA] = useState(null)

  const addCourse = (semesterIndex) => {
    const newSemesters = [...semesters]
    newSemesters[semesterIndex].courses.push({ credits: '', grade: '' })
    setSemesters(newSemesters)
  }

  const addSemester = () => {
    setSemesters([...semesters, { courses: [{ credits: '', grade: '' }], sgpa: null }])
  }

  const handleCourseChange = (semesterIndex, courseIndex, field, value) => {
    const newSemesters = [...semesters]
    newSemesters[semesterIndex].courses[courseIndex][field] = value
    setSemesters(newSemesters)
  }

  const getGradePoints = (grade) => {
    const gradePoints = {
      'O': 10, 'A+': 9, 'A': 8.5, 'B+': 8,
      'B': 7, 'C': 6, 'P': 5, 'F': 0
    }
    return gradePoints[grade] || 0
  }

  const calculateSGPA = (courses) => {
    let totalCredits = 0
    let totalPoints = 0

    courses.forEach(course => {
      if (course.credits && course.grade) {
        const credits = parseFloat(course.credits)
        const gradePoints = getGradePoints(course.grade)
        totalCredits += credits
        totalPoints += credits * gradePoints
      }
    })

    return totalCredits ? (totalPoints / totalCredits).toFixed(2) : 0
  }

  const calculateCGPA = () => {
    const newSemesters = semesters.map(semester => ({
      ...semester,
      sgpa: calculateSGPA(semester.courses)
    }))
    setSemesters(newSemesters)

    const totalSGPA = newSemesters.reduce((sum, sem) => sum + parseFloat(sem.sgpa), 0)
    const finalCGPA = totalSGPA / newSemesters.length
    setCGPA(isNaN(finalCGPA) ? 0 : finalCGPA.toFixed(2))
  }

  return (
    <div className={styles.container}>
      <h1>CGPA Calculator</h1>
      
      {semesters.map((semester, semesterIndex) => (
        <div key={semesterIndex} className={styles.semester}>
          <h3>Semester {semesterIndex + 1}</h3>
          
          {semester.courses.map((course, courseIndex) => (
            <div key={courseIndex} className={styles.course}>
              <select
                value={course.credits}
                onChange={(e) => handleCourseChange(semesterIndex, courseIndex, 'credits', e.target.value)}
                className={styles.select}
              >
                <option value="">Credits</option>
                {[1, 2, 3, 4, 5, 6].map(credit => (
                  <option key={credit} value={credit}>{credit}</option>
                ))}
              </select>

              <select
                value={course.grade}
                onChange={(e) => handleCourseChange(semesterIndex, courseIndex, 'grade', e.target.value)}
                className={styles.select}
              >
                <option value="">Grade</option>
                {['O', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F'].map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
            </div>
          ))}
          
          <button onClick={() => addCourse(semesterIndex)} className={styles.addButton}>
            Add Course
          </button>

          {semester.sgpa !== null && (
            <div className={styles.sgpa}>
              Semester GPA: {semester.sgpa}
            </div>
          )}
        </div>
      ))}

      <button onClick={addSemester} className={styles.addButton}>
        Add Semester
      </button>

      <button onClick={calculateCGPA} className={styles.calculateButton}>
        Calculate CGPA
      </button>

      {cgpa !== null && (
        <div className={styles.result}>
          Your CGPA: {cgpa}
        </div>
      )}
    </div>
  )
}
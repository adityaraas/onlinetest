// src/App.js
import React, { useState, useEffect } from 'react';
import './App.css'; // You can modify this stylesheet as needed

function App() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [markedToCheck, setMarkedToCheck] = useState([]);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [autoSubmitTimer, setAutoSubmitTimer] = useState(null);
  const totalTimeLimit = 500; // Total time allowed for the test in seconds
  const [testStarted, setTestStarted] = useState(false);

  useEffect(() => {
    // Fetch questions from exam.json
    fetch('/exam.json') // Replace with the actual path
      .then(response => response.json())
      .then(data => setQuestions(data.questions))
      .catch(error => console.error('Error fetching questions:', error));
  }, []);

  

  useEffect(() => {
    // Update the timer every second
    const timerInterval = setInterval(() => {
      if (startTime && !endTime) {
        const currentTime = new Date();
        const elapsed = Math.floor((currentTime - startTime) / 1000);
        setTimeElapsed(elapsed);

        // Check if the time limit has been reached
        if (elapsed >= totalTimeLimit) {
          handleFinishTest();
        }
      }
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [startTime, endTime, totalTimeLimit]);

  const handleOptionSelect = (option) => {
    setSelectedOptions({
      ...selectedOptions,
      [currentQuestion]: option,
    });
  };

  const handleNextQuestion = () => {
    // Check if the selected option is correct
    const selectedOption = selectedOptions[currentQuestion];
    if (selectedOption === questions[currentQuestion].answer) {
      setScore(score + 1);
    }

    // Move to the next question
    setCurrentQuestion(currentQuestion + 1);

    // Reset the auto-submit timer for the next question
    resetAutoSubmitTimer();

    // Set the start time for the next question
    setQuestionStartTime(new Date());
  };

  const handlePreviousQuestion = () => {
    // Move to the previous question
    setCurrentQuestion(currentQuestion - 1);

    // Reset the auto-submit timer for the previous question
    resetAutoSubmitTimer();

    // Set the start time for the previous question
    setQuestionStartTime(new Date());
  };

  const handleStartTest = () => {
    setStartTime(new Date());
    setQuestionStartTime(new Date());
    setTestStarted(true);

    // Set the auto-submit timer
    setAutoSubmitTimer(setTimeout(() => handleFinishTest(), totalTimeLimit * 1000));
  };

  const handleFinishTest = () => {
    setEndTime(new Date());

    // Clear the auto-submit timer
    clearTimeout(autoSubmitTimer);
  };

  const calculateTimeTaken = () => {
    if (startTime && endTime) {
      const timeDiff = endTime - startTime;
      const seconds = Math.floor(timeDiff / 1000);
      return seconds;
    }
    return null;
  };

  const calculateQuestionTimeTaken = () => {
    if (questionStartTime) {
      const currentTime = new Date();
      const elapsed = Math.floor((currentTime - questionStartTime) / 1000);
      return elapsed;
    }
    return null;
  };

  const resetAutoSubmitTimer = () => {
    // Clear the existing auto-submit timer
    clearTimeout(autoSubmitTimer);

    // Set a new auto-submit timer
    setAutoSubmitTimer(setTimeout(() => handleFinishTest(), totalTimeLimit * 1000));
  };

  const handleClearResponse = () => {
    // Clear the selected option for the current question
    setSelectedOptions({
      ...selectedOptions,
      [currentQuestion]: null,
    });
  };

  const markForReviewAndNext = () => {
    // Mark the question for review
    if (!markedToCheck.includes(currentQuestion)) {
      setMarkedToCheck([...markedToCheck, currentQuestion]);
    }

    // Move to the next question
    setCurrentQuestion(currentQuestion + 1);

    // Reset the auto-submit timer for the next question
    resetAutoSubmitTimer();

    // Set the start time for the next question
    setQuestionStartTime(new Date());
  };

  const calculateTimeLeft = () => {
    if (startTime && !endTime) {
      const currentTime = new Date();
      const elapsed = Math.floor((currentTime - startTime) / 1000);
      const timeLeft = totalTimeLimit - elapsed;
      return timeLeft > 0 ? timeLeft : 0;
    }
    return null;
  };

  const getQuestionStatus = (index) => {
    const selectedOption = selectedOptions[index];
    if (selectedOption) {
      return 'answered';
    } else {
      return 'unanswered';
    }
  };

  const markedForReview = (index) => {
    const selectedOption = selectedOptions[index];
    return selectedOption === 'marked';
  };

  const getAnalysisCounts = () => {
    const answeredCount = questions.filter((_, index) => getQuestionStatus(index) === 'answered').length;
    const unansweredCount = questions.filter((_, index) => getQuestionStatus(index) === 'unanswered').length;
    const markedForReviewCount = markedToCheck.length;

    const unvisitedCount = questions.filter(
      (_, index) => selectedOptions[index] === undefined && !markedToCheck.includes(index)
    ).length;

    return { answeredCount, unansweredCount, markedForReviewCount, unvisitedCount };
  };

  const fullMarks = score === questions.length;

  if (!testStarted) {
    return (
      <div className="container">
        <div className="main-content">
          <h2>Welcome to the Test!</h2>
          <p>Click the button below to start the test.</p>
          <p>Total time allotted: {totalTimeLimit} seconds</p>
          <button onClick={handleStartTest}>Start Test</button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return <div>Loading...</div>;
  }

  if (currentQuestion >= questions.length || endTime) {
    const { answeredCount, unansweredCount, markedForReviewCount, unvisitedCount } = getAnalysisCounts();

    return (
      <div className={`container ${fullMarks ? 'party-time' : ''}`}>
        <div className="main-content completion-screen">
          <h2>Exam Completed 🎉</h2>
          <div className="completion-summary">
            <p>Your score: {score}/{questions.length}</p>
            <p>Time taken: {calculateTimeTaken()} seconds</p>
          </div>
          <div className="analysis-box">
            <h3>Analysis</h3>
            <p>Answered: {answeredCount}</p>
            <p>Unanswered: {unansweredCount}</p>
            <p>Marked for Review: {markedForReviewCount}</p>
            <p>Not Visited: {unvisitedCount}</p>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestionData = questions[currentQuestion];
  const { answeredCount, unansweredCount, markedForReviewCount, unvisitedCount } = getAnalysisCounts();

  return (
    <div className={`container ${fullMarks ? 'party-time' : ''}`}>
      <div className="sidebar">
        <h3>Questions</h3>
        <div className="question-buttons">
          {questions.map((q, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestion(index)}
              className={index === currentQuestion ? 'active' : ''}
            >
              Q{index + 1} {selectedOptions[index] && '✔️'} {markedToCheck.includes(index) && '📌'}
            </button>
          ))}
        </div>
        <div className="analysis-box">
          <h3>Analysis</h3>
          <p>Answered: {answeredCount}</p>
          <p>Unanswered: {unansweredCount}</p>
          <p>Marked for Review: {markedForReviewCount}</p>
          <p>Not Visited: {unvisitedCount}</p>
        </div>
      </div>
      <div className="main-content">
        <h2>Question {currentQuestion + 1}</h2>
        <p>{currentQuestionData.question}</p>
        <ul>
          {currentQuestionData.options.map((option, index) => (
            <li key={index}>
              <label>
                <input
                  type="radio"
                  name="options"
                  value={option}
                  checked={selectedOptions[currentQuestion] === option}
                  onChange={() => handleOptionSelect(option)}
                />
                {String.fromCharCode(97 + index)}. {option}
              </label>
            </li>
          ))}
        </ul>
        <p>Time elapsed: {timeElapsed} seconds</p>
        <p>Total time allotted: {totalTimeLimit} seconds</p>
        <p>Time left: {calculateTimeLeft()} seconds</p>
        <p>Time taken on this question: {calculateQuestionTimeTaken()} seconds</p>
        <button onClick={handlePreviousQuestion} disabled={currentQuestion === 0}>
          Previous
        </button>
        <button onClick={handleNextQuestion}>
          {currentQuestion === questions.length - 1 ? 'Finish' : 'Next'}
        </button>
        <button onClick={markForReviewAndNext}>Mark for Review and Next</button>
        <button onClick={handleFinishTest}>Finish Test</button>
        <button onClick={handleClearResponse}>Clear Response</button>
      </div>
    </div>
  );
}

export default App;

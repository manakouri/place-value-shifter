{\rtf1\ansi\ansicpg1252\cocoartf2822
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 document.getElementById('login-btn').addEventListener('click', () => \{\
  const gameCode = document.getElementById('game-code').value.trim();\
  const teamName = document.getElementById('team-name').value.trim();\
\
  if (gameCode && teamName) \{\
    document.getElementById('login-screen').classList.add('hidden');\
    document.getElementById('game-screen').classList.remove('hidden');\
    document.getElementById('team-display').textContent = `Team: $\{teamName\}`;\
    // Placeholder: Load first question\
    document.getElementById('question-text').textContent = "What is 3 \'d7 10?";\
    const answers = ["30", "3", "300", "0.3"];\
    const answerContainer = document.getElementById('answer-options');\
    answerContainer.innerHTML = '';\
    answers.forEach(ans => \{\
      const btn = document.createElement('button');\
      btn.textContent = ans;\
      answerContainer.appendChild(btn);\
    \});\
  \}\
\});\
\
document.getElementById('toggle-leaderboard').addEventListener('click', () => \{\
  const lb = document.getElementById('leaderboard');\
  lb.classList.toggle('hidden');\
\});\
}
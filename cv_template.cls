% =============================================================================
% ResumeKit - Black & White Single-Page Resume Class
% File: cv_template.cls
% Description: High-performance, ATS-optimized, modular resume class.
% =============================================================================

\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{cv_template}[2026/07/23 Modular Black & White Single-Page Resume Class]

% Base Document Class: Letter size with 10pt base font
\LoadClass[10pt, a4paper]{article}

% --- Engine Detection & Font Setup ---
\RequirePackage{iftex}

\ifXeTeX
  \RequirePackage{fontspec}
  \RequirePackage{lmodern}
\else\ifluatex
  \RequirePackage{fontspec}
  \RequirePackage{lmodern}
\else
  \RequirePackage[T1]{fontenc}
  \RequirePackage[utf8]{inputenc}
  \RequirePackage{lmodern}
\fi\fi

% --- Core Utility & Formatting Packages ---
\RequirePackage{geometry}    % Page margins and dimensions
\RequirePackage{enumitem}    % Tight list item spacing control
\RequirePackage{hyperref}    % Hyperlink support
\RequirePackage{import}      % Modular file imports
\RequirePackage{etoolbox}    % TeX conditional logic & list helpers
\RequirePackage{catchfile}   % Reading external text files into macros
\RequirePackage{parskip}     % Paragraph spacing management
\RequirePackage{adjustbox}   % Dynamic box scaling for 1-page fitting

% Optional FontAwesome icons support
\RequirePackage{fontawesome5}

% --- Single-Page Geometry Parameters ---
\geometry{
  top=0.35in,
  bottom=0.35in,
  left=0.45in,
  right=0.45in
}

\pagestyle{empty}

% --- Pure Black & White Link Styling (ATS Compliant) ---
\hypersetup{
  hidelinks,
  pdfborder={0 0 0}
}

% --- Minimal Underline Configuration (Subtle & ATS-Friendly) ---
\RequirePackage[normalem]{ulem}
\setlength{\ULdepth}{1.8pt}
\renewcommand{\ULthickness}{0.3pt}
\renewcommand{\underline}{\uline}

% --- Section Separation Rule Toggles (Disabled for pure ATS compatibility) ---
\newbool{drawsectionrules}
\setbool{drawsectionrules}{false}

\newcommand{\showrules}{\setbool{drawsectionrules}{true}}
\newcommand{\hiderules}{\setbool{drawsectionrules}{false}}
\newcommand{\cvline}{}

% --- Set-and-Forget Auto-Fetching Contact & Profile Fields ---
\newcommand{\@cvname}{}
\newcommand{\@cvtagline}{}
\newcommand{\@cvphone}{}
\newcommand{\@cvemail}{}
\newcommand{\@cvlinkedin}{}
\newcommand{\@cvgithub}{}
\newcommand{\@cvwebsite}{}
\newcommand{\@cvlocation}{}
\newcommand{\@customcontacts}{}

\newcommand{\name}[1]{\renewcommand{\@cvname}{#1}}
\newcommand{\tagline}[1]{\renewcommand{\@cvtagline}{#1}}

% Parameterless link macros: Auto-fetches text from links/<field>.tex if no argument is passed!
\newcommand{\phone}[1][]{%
  \ifstrempty{#1}{%
    \IfFileExists{links/phone.tex}{\CatchFileDef{\@cvphone}{links/phone.tex}{\endlinechar=-1}}{}%
  }{%
    \renewcommand{\@cvphone}{#1}%
  }%
}

\newcommand{\email}[1][]{%
  \ifstrempty{#1}{%
    \IfFileExists{links/email.tex}{\CatchFileDef{\@cvemail}{links/email.tex}{\endlinechar=-1}}{}%
  }{%
    \renewcommand{\@cvemail}{#1}%
  }%
}

\newcommand{\linkedin}[1][]{%
  \ifstrempty{#1}{%
    \IfFileExists{links/linkedin.tex}{\CatchFileDef{\@cvlinkedin}{links/linkedin.tex}{\endlinechar=-1}}{}%
  }{%
    \renewcommand{\@cvlinkedin}{#1}%
  }%
}

\newcommand{\github}[1][]{%
  \ifstrempty{#1}{%
    \IfFileExists{links/github.tex}{\CatchFileDef{\@cvgithub}{links/github.tex}{\endlinechar=-1}}{}%
  }{%
    \renewcommand{\@cvgithub}{#1}%
  }%
}

\newcommand{\website}[1][]{%
  \ifstrempty{#1}{%
    \IfFileExists{links/website.tex}{\CatchFileDef{\@cvwebsite}{links/website.tex}{\endlinechar=-1}}{}%
  }{%
    \renewcommand{\@cvwebsite}{#1}%
  }%
}

\newcommand{\location}[1][]{%
  \ifstrempty{#1}{%
    \IfFileExists{links/location.tex}{\CatchFileDef{\@cvlocation}{links/location.tex}{\endlinechar=-1}}{}%
  }{%
    \renewcommand{\@cvlocation}{#1}%
  }%
}

\newcommand{\addcontact}[1]{%
  \ifdefempty{\@customcontacts}{%
    \gappto\@customcontacts{#1}%
  }{%
    \gappto\@customcontacts{\ \ \textbar\ \ #1}%
  }%
}
\newcommand{\addcontactlink}[2]{\addcontact{\href{#2}{#1}}}

\newbool{firstcontact}

% --- Clean Candidate Header Renderer ---
\newcommand{\makecvheader}{%
  \begin{center}
    {\Huge \bfseries \@cvname}\par
    \ifcsempty{@cvtagline}{}{%
      \vspace{2pt}%
      {\small \itshape \@cvtagline}\par
    }%
    \setbool{firstcontact}{true}%
    \def\printitem##1{%
      \ifbool{firstcontact}{\setbool{firstcontact}{false}}{\ \ \textbar\ \ }##1%
    }%
    \vspace{3pt}%
    {\footnotesize%
      \ifcsempty{@cvphone}{}{\printitem{\@cvphone}}%
      \ifcsempty{@cvemail}{}{\printitem{\href{mailto:\@cvemail}{\@cvemail}}}%
      \ifcsempty{@cvlinkedin}{}{\printitem{\href{https://linkedin.com/in/\@cvlinkedin}{linkedin.com/in/\@cvlinkedin}}}%
      \ifcsempty{@cvgithub}{}{\printitem{\href{https://github.com/\@cvgithub}{github.com/\@cvgithub}}}%
      \ifcsempty{@cvwebsite}{}{\printitem{\href{https://\@cvwebsite}{\@cvwebsite}}}%
      \ifcsempty{@cvlocation}{}{\printitem{\@cvlocation}}%
      \ifcsempty{@customcontacts}{}{\printitem{\@customcontacts}}%
    }\par
  \end{center}%
  \vspace{2pt}%
}

% --- Dynamic 1-Page Auto-Fitting Wrapper Environment ---
\newenvironment{fitpage}{%
  \clearpage
  \begin{adjustbox}{max totalheight=\textheight, max width=\textwidth, keepaspectratio}%
    \begin{minipage}{\textwidth}%
}{%
    \end{minipage}%
  \end{adjustbox}%
}

% --- Section Headings (Clean ATS Format) ---
\newcommand{\cvsectionheader}[2][false]{%
  \par\vspace{8pt}%
  {\large \bfseries \MakeUppercase{#2}}\par\vspace{3pt}%
}

\newenvironment{cvsection}[2][false]{%
  \cvsectionheader[#1]{#2}%
}{%
  \vspace{2pt}%
}

% --- Bullet Item List ---
\newenvironment{cvlist}{%
  \begin{itemize}[
    leftmargin=12pt,
    itemsep=1pt,
    parsep=0pt,
    topsep=1pt,
    partopsep=0pt,
    label=\small\textbullet
  ]%
}{%
  \end{itemize}%
}

% --- Experience & Education Entry Environments ---
\newenvironment{cventry}[4]{%
  \vspace{2pt}%
  \noindent
  \begin{tabular*}{\textwidth}{@{\extracolsep{\fill}} l r @{}}
    \textbf{#1} & \textit{#4} \\
    \textit{#2} & \textit{#3} \\
  \end{tabular*}\par
  \vspace{-2pt}%
  \begin{cvlist}%
}{%
  \end{cvlist}%
}

\newcommand{\cventrysimple}[4]{%
  \vspace{2pt}%
  \noindent
  \begin{tabular*}{\textwidth}{@{\extracolsep{\fill}} l r @{}}
    \textbf{#1} & \textit{#4} \\
    \textit{#2} & \textit{#3} \\
  \end{tabular*}\par
  \vspace{1pt}%
}

\newenvironment{cvproject}[2]{%
  \vspace{2pt}%
  \noindent
  \begin{tabular*}{\textwidth}{@{\extracolsep{\fill}} l r @{}}
    \textbf{#1} & \textit{#2} \\
  \end{tabular*}\par
  \vspace{-2pt}%
  \begin{cvlist}%
}{%
  \end{cvlist}%
}

\newcommand{\cvskill}[2]{%
  \noindent\textbf{#1:} #2\par\vspace{2pt}%
}

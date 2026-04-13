import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { Badge, Card, Kpi, SectionHeader } from '@/components/ui/Primitives';
import {
  getAssessmentFormBundle,
  getSectionQuestions,
  saveAssessmentSubmission,
  type LecturerAssessmentFormBundle,
  type LecturerAssessmentQuestion,
} from '@/lib/lecturerAssessment';

type PublicFormState = {
  lecturerName: string;
  email: string;
  phone: string;
  yearsTeaching: string;
  notes: string;
  answers: Record<string, string>;
};

type PublicQuestionGroup = {
  title: string;
  questions: LecturerAssessmentQuestion[];
};

type MultipleChoiceOption = {
  key: string;
  label: string;
};

const CASE_1_ROWS = [
  ['T\u00f4i hi\u1ec3u r\u00f5 quy\u1ec1n quy\u1ebft \u0111\u1ecbnh c\u1ee7a m\u00ecnh', '61', '36'],
  ['T\u00f4i c\u00f3 th\u1ec3 n\u00eau r\u1ee7i ro m\u00e0 kh\u00f4ng s\u1ee3 b\u1ecb \u0111\u00e1nh gi\u00e1', '68', '41'],
  ['C\u00e1c ph\u00f2ng ban ph\u1ed1i h\u1ee3p hi\u1ec7u qu\u1ea3', '79', '58'],
  ['T\u00f4i hi\u1ec3u \u01b0u ti\u00ean chi\u1ebfn l\u01b0\u1ee3c c\u1ee7a \u0111\u01a1n v\u1ecb', '73', '75'],
  ['T\u00f4i s\u1eb5n s\u00e0ng n\u1ed7 l\u1ef1c th\u00eam khi c\u1ea7n', '71', '74'],
];

function isStructuredSet(questionSetCode: string) {
  return questionSetCode === 'bo-3' || questionSetCode === 'bo-4';
}

function renderRichTextBlock(text: string) {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  return lines.map((line, index) => {
    if (line.startsWith('- ')) {
      return (
        <li key={`${line}-${index}`} className="lecturer-rich-bullet">
          {line.slice(2)}
        </li>
      );
    }

    return (
      <p key={`${line}-${index}`} className="lecturer-rich-paragraph">
        {line}
      </p>
    );
  });
}

function renderStructuredIntro(questionSetCode: string) {
  if (!isStructuredSet(questionSetCode)) return null;

  return (
    <Card title={'B\u1ed9 c\u00e2u h\u1ecfi \u0111\u00e1nh gi\u00e1 online gi\u1ea3ng vi\u00ean v\u1ec1 v\u0103n h\u00f3a doanh nghi\u1ec7p'}>
      <div className="lecturer-doc-intro">
        <div className="lecturer-doc-subtitle">{'(\u0110\u00e1nh gi\u00e1 s\u01a1 tuy\u1ec3n)'}</div>
        <p>{'K\u00ednh ch\u00e0o Qu\u00fd Gi\u1ea3ng vi\u00ean, Chuy\u00ean gia,'}</p>
        <p>{'Ch\u00e0o m\u1eebng Qu\u00fd Gi\u1ea3ng vi\u00ean, Chuy\u00ean gia \u0111\u00e3 s\u1eafp x\u1ebfp th\u1eddi gian tham gia n\u1ed9i dung \u0111\u00e1nh gi\u00e1 s\u01a1 tuy\u1ec3n c\u1ee7a PeopleOne.'}</p>
        <p>{'B\u00e0i \u0111\u00e1nh gi\u00e1 g\u1ed3m 2 ph\u1ea7n:'}</p>
        <ul className="lecturer-rich-list">
          <li>{'Ph\u1ea7n A - 14 c\u00e2u tr\u1eafc nghi\u1ec7m t\u00ecnh hu\u1ed1ng'}</li>
          <li>{'Ph\u1ea7n B - 6 c\u00e2u tr\u1ea3 l\u1eddi ng\u1eafn b\u1eaft bu\u1ed9c'}</li>
        </ul>
      </div>
    </Card>
  );
}

function renderCaseContext(groupTitle: string, sectionId: string, questionSetCode: string): ReactNode {
  if (questionSetCode !== 'bo-4' || sectionId !== 'mcq') return null;

  if (groupTitle.startsWith('Case 1')) {
    return (
      <div className="lecturer-rich-prompt">
        <h5>{'PH\u1ea6N A - C\u00c2U H\u1eceI TR\u1eaeC NGHI\u1ec6M T\u00ccNH HU\u1ed0NG'}</h5>
        <h6>{'Case 1: "Thi\u1ebfu ch\u1ee7 \u0111\u1ed9ng" hay "thi\u1ebfu \u0111i\u1ec1u ki\u1ec7n \u0111\u1ec3 ch\u1ee7 \u0111\u1ed9ng"?'}</h6>
        <p>{'M\u1ed9t t\u1ed5 ch\u1ee9c ph\u1ea3n \u00e1nh: "Nh\u00e2n s\u1ef1 thi\u1ebfu ch\u1ee7 \u0111\u1ed9ng, ng\u1ea1i ph\u1ed1i h\u1ee3p, vi\u1ec7c g\u00ec c\u0169ng ch\u1edd c\u1ea5p tr\u00ean."'}</p>
        <div className="lecturer-rich-block">
          <strong>{'D\u1eef ki\u1ec7n 1: K\u1ebft qu\u1ea3 kh\u1ea3o s\u00e1t n\u1ed9i b\u1ed9 200 ng\u01b0\u1eddi'}</strong>
          <div className="lecturer-rich-table-wrap">
            <table className="lecturer-rich-table">
              <thead>
                <tr>
                  <th>{'Ch\u1ec9 s\u1ed1'}</th>
                  <th>{'N\u0103m tr\u01b0\u1edbc'}</th>
                  <th>{'N\u0103m nay'}</th>
                </tr>
              </thead>
              <tbody>
                {CASE_1_ROWS.map((row) => (
                  <tr key={row[0]}>
                    <td>{row[0]}</td>
                    <td>{row[1]}</td>
                    <td>{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="lecturer-rich-block">
          <strong>{'D\u1eef ki\u1ec7n 2: C\u00e1c ch\u1ec9 s\u1ed1 v\u1eadn h\u00e0nh'}</strong>
          <ul className="lecturer-rich-list">
            <li>{'M\u1ed9t s\u00e1ng ki\u1ebfn li\u00ean ph\u00f2ng ban c\u1ea7n trung b\u00ecnh 5,2 l\u1edbp ph\u00ea duy\u1ec7t'}</li>
            <li>{'Th\u1eddi gian ra quy\u1ebft \u0111\u1ecbnh trung b\u00ecnh: 18 ng\u00e0y'}</li>
            <li>{'62% \u0111\u1ec1 xu\u1ea5t b\u1ecb tr\u1ea3 v\u1ec1 v\u00ec "ch\u01b0a \u0111\u00fang th\u1ea9m quy\u1ec1n"'}</li>
            <li>{'Sau t\u00e1i c\u01a1 c\u1ea5u, nhi\u1ec1u \u0111\u1ea7u m\u1ed1i qu\u1ea3n l\u00fd thay \u0111\u1ed5i nh\u01b0ng ch\u01b0a l\u00e0m r\u00f5 ch\u1ee9c n\u0103ng, quy\u1ec1n h\u1ea1n'}</li>
          </ul>
        </div>
        <div className="lecturer-rich-block">
          <strong>{'D\u1eef ki\u1ec7n 3: K\u1ebft qu\u1ea3 ph\u1ecfng v\u1ea5n s\u01a1 b\u1ed9'}</strong>
          <ul className="lecturer-rich-list">
            <li>{'Qu\u1ea3n l\u00fd A: "M\u1ecdi ng\u01b0\u1eddi kh\u00f4ng d\u00e1m t\u1ef1 quy\u1ebft."'}</li>
            <li>{'Nh\u00e2n vi\u00ean B: "T\u1ef1 quy\u1ebft sai th\u00ec r\u1ea5t d\u1ec5 b\u1ecb h\u1ecfi tr\u00e1ch nhi\u1ec7m, c\u00f2n xin \u00fd ki\u1ebfn th\u00ec an to\u00e0n h\u01a1n."'}</li>
            <li>{'L\u00e3nh \u0111\u1ea1o C: "Ch\u00fang t\u00f4i c\u1ea7n v\u0103n ho\u00e1 ch\u1ee7 \u0111\u1ed9ng h\u01a1n."'}</li>
          </ul>
        </div>
      </div>
    );
  }

  if (groupTitle.startsWith('Case 2')) {
    return (
      <div className="lecturer-rich-prompt">
        <h5>{'Case 2: Gi\u00e1 tr\u1ecb c\u1ed1t l\u00f5i "s\u1ed1ng" hay ch\u1ec9 "\u0111\u01b0\u1ee3c nh\u1edb"?'}</h5>
        <p>{'M\u1ed9t t\u1ed5 ch\u1ee9c c\u00f4ng b\u1ed1 3 gi\u00e1 tr\u1ecb c\u1ed1t l\u00f5i: Kh\u00e1ch h\u00e0ng l\u00e0 tr\u1ecdng t\u00e2m - T\u1ed1c \u0111\u1ed9 - Tr\u00e1ch nhi\u1ec7m.'}</p>
        <div className="lecturer-rich-block">
          <strong>{'Sau 18 th\u00e1ng tri\u1ec3n khai'}</strong>
          <ul className="lecturer-rich-list">
            <li>{'86% nh\u00e2n s\u1ef1 nh\u1edb \u0111\u01b0\u1ee3c \u00edt nh\u1ea5t 2/3 gi\u00e1 tr\u1ecb'}</li>
            <li>{'78% qu\u1ea3n l\u00fd \u0111\u00e1nh gi\u00e1 truy\u1ec1n th\u00f4ng n\u1ed9i b\u1ed9 \u0111\u00e3 l\u00e0m t\u1ed1t'}</li>
            <li>{'Ti\u00eau ch\u00ed khen th\u01b0\u1edfng ch\u1ee7 y\u1ebfu l\u00e0 kh\u00f4ng \u0111\u1ec3 x\u1ea3y ra sai s\u00f3t, tu\u00e2n th\u1ee7 quy tr\u00ecnh, ti\u1ebft ki\u1ec7m chi ph\u00ed'}</li>
            <li>{'72% qu\u1ea3n l\u00fd trung gian \u0111\u1ed3ng \u00fd: "Ch\u1ee7 \u0111\u1ed9ng l\u00e0m \u0111i\u1ec1u m\u1edbi m\u00e0 th\u1ea5t b\u1ea1i s\u1ebd \u1ea3nh h\u01b0\u1edfng b\u1ea5t l\u1ee3i \u0111\u1ebfn \u0111\u00e1nh gi\u00e1 cu\u1ed1i n\u0103m"'}</li>
            <li>{'64% nh\u00e2n s\u1ef1 n\u00f3i: "Gi\u1ea3i ph\u00e1p nhanh cho kh\u00e1ch h\u00e0ng th\u01b0\u1eddng ch\u1eadm l\u1ea1i v\u00ec ph\u1ea3i xin \u0111\u1ee7 \u00fd ki\u1ebfn"'}</li>
            <li>{'Trong 20 h\u1ed3 s\u01a1 khen th\u01b0\u1edfng qu\u00fd g\u1ea7n nh\u1ea5t, ch\u1ec9 2 h\u1ed3 s\u01a1 n\u00eau r\u00f5 t\u00e1c \u0111\u1ed9ng t\u00edch c\u1ef1c \u0111\u1ebfn kh\u00e1ch h\u00e0ng'}</li>
            <li>{'Trong 12 quy\u1ebft \u0111\u1ecbnh nh\u00e2n s\u1ef1 c\u1ea5p qu\u1ea3n l\u00fd g\u1ea7n nh\u1ea5t, y\u1ebfu t\u1ed1 \u0111\u01b0\u1ee3c nh\u1eafc nhi\u1ec1u nh\u1ea5t l\u00e0 an to\u00e0n, ch\u1eafc ch\u1eafn, \u00edt r\u1ee7i ro'}</li>
          </ul>
        </div>
      </div>
    );
  }

  if (groupTitle.startsWith('Case 3')) {
    return (
      <div className="lecturer-rich-prompt">
        <h5>{'Case 3: Y\u00eau c\u1ea7u \u0111\u00e0o t\u1ea1o m\u01a1 h\u1ed3 t\u1eeb kh\u00e1ch h\u00e0ng'}</h5>
        <p>{'"Ch\u00fang t\u00f4i mu\u1ed1n tri\u1ec3n khai ch\u01b0\u01a1ng tr\u00ecnh VHDN \u0111\u1ec3 c\u1ea3i thi\u1ec7n ph\u1ed1i h\u1ee3p sau t\u00e1i c\u01a1 c\u1ea5u. C\u00e1c \u0111\u01a1n v\u1ecb \u0111ang kh\u00e1 c\u1ee5c b\u1ed9. Mong PeopleOne \u0111\u1ec1 xu\u1ea5t ch\u01b0\u01a1ng tr\u00ecnh ph\u00f9 h\u1ee3p."'}</p>
        <div className="lecturer-rich-block">
          <strong>{'Th\u00f4ng tin b\u1ed5 sung'}</strong>
          <ul className="lecturer-rich-list">
            <li>{'Ch\u01b0a c\u00f3 d\u1eef li\u1ec7u kh\u1ea3o s\u00e1t ch\u00ednh th\u1ee9c'}</li>
            <li>{'L\u00e3nh \u0111\u1ea1o c\u1ea5p cao cho r\u1eb1ng "v\u1ea5n \u0111\u1ec1 l\u00e0 t\u01b0 duy silo"'}</li>
            <li>{'M\u1ed9t qu\u1ea3n l\u00fd trung gian n\u00f3i: "Vai tr\u00f2 m\u1edbi sau t\u00e1i c\u01a1 c\u1ea5u c\u00f2n ch\u1ed3ng l\u1ea5n"'}</li>
            <li>{'Trong 3 th\u00e1ng g\u1ea7n \u0111\u00e2y c\u00f3 4 d\u1ef1 \u00e1n ch\u1eadm ti\u1ebfn \u0111\u1ed9 do "ch\u1edd \u0111\u1ea7u m\u1ed1i th\u1ed1ng nh\u1ea5t"'}</li>
          </ul>
        </div>
      </div>
    );
  }

  if (groupTitle.startsWith('Case 4')) {
    return (
      <div className="lecturer-rich-prompt">
        <h5>{'Case 4: Thi\u1ebft k\u1ebf l\u1edbp h\u1ecdc cho m\u00f4i tr\u01b0\u1eddng nhi\u1ec1u c\u1ea5p b\u1eadc, nh\u1ea1y c\u1ea3m'}</h5>
        <div className="lecturer-rich-block">
          <strong>{'B\u1ed1i c\u1ea3nh l\u1edbp h\u1ecdc'}</strong>
          <ul className="lecturer-rich-list">
            <li>{'60 h\u1ecdc vi\u00ean'}</li>
            <li>{'C\u00f3 c\u1ea3 l\u00e3nh \u0111\u1ea1o, qu\u1ea3n l\u00fd trung gian, chuy\u00ean vi\u00ean'}</li>
            <li>{'Ch\u1ee7 \u0111\u1ec1: "Vai tr\u00f2 l\u00e3nh \u0111\u1ea1o v\u00e0 qu\u1ea3n l\u00fd trong nu\u00f4i d\u01b0\u1ee1ng v\u0103n ho\u00e1 th\u1ef1c thi"'}</li>
            <li>{'C\u00e1c bu\u1ed5i tr\u01b0\u1edbc h\u1ecdc vi\u00ean r\u1ea5t \u00edt ph\u00e1t bi\u1ec3u khi c\u00f3 m\u1eb7t c\u1ea5p tr\u00ean'}</li>
            <li>{'\u0110\u01a1n v\u1ecb t\u1ed5 ch\u1ee9c mu\u1ed1n l\u1edbp h\u1ecdc "th\u1ef1c ch\u1ea5t, kh\u00f4ng h\u00ecnh th\u1ee9c"'}</li>
          </ul>
        </div>
      </div>
    );
  }

  return null;
}

function extractMultipleChoiceOptions(prompt: string): MultipleChoiceOption[] {
  return prompt
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^[A-E]\.\s/.test(line))
    .map((line) => ({
      key: line.slice(0, 1),
      label: line.slice(3),
    }));
}

function extractQuestionPromptBody(prompt: string) {
  const lines = prompt.split('\n').map((line) => line.trim()).filter(Boolean);
  const questionLineIndex = lines.findIndex((line) => /^C\u00e2u\s+\d+/i.test(line));
  if (questionLineIndex === -1) return prompt;

  const questionLine = lines[questionLineIndex].replace(/^C\u00e2u\s+\d+\s*[:-]?\s*/i, '').trim();
  const extraLines = lines.slice(questionLineIndex + 1).filter((line) => !/^[A-E]\.\s/.test(line));
  return [questionLine, ...extraLines].filter(Boolean).join('\n');
}

function renderQuestionPrompt(question: LecturerAssessmentQuestion, questionSetCode: string) {
  if (isStructuredSet(questionSetCode)) {
    return <div className="lecturer-rich-block lecturer-rich-question">{renderRichTextBlock(extractQuestionPromptBody(question.prompt))}</div>;
  }

  return <div className="lecturer-rich-block lecturer-rich-question">{renderRichTextBlock(question.prompt)}</div>;
}

function groupQuestionsForPublic(sectionId: string, questionSetCode: string, questions: LecturerAssessmentQuestion[]): PublicQuestionGroup[] {
  if (!isStructuredSet(questionSetCode)) {
    return [{ title: '', questions }];
  }

  if (sectionId === 'mcq') {
    return [
      { title: 'Case 1: "Thi\u1ebfu ch\u1ee7 \u0111\u1ed9ng" hay "thi\u1ebfu \u0111i\u1ec1u ki\u1ec7n \u0111\u1ec3 ch\u1ee7 \u0111\u1ed9ng"?', questions: questions.filter((item) => Number(item.code) >= 1 && Number(item.code) <= 4) },
      { title: 'Case 2: Gi\u00e1 tr\u1ecb c\u1ed1t l\u00f5i "s\u1ed1ng" hay ch\u1ec9 "\u0111\u01b0\u1ee3c nh\u1edb"?', questions: questions.filter((item) => Number(item.code) >= 5 && Number(item.code) <= 8) },
      { title: 'Case 3: Y\u00eau c\u1ea7u \u0111\u00e0o t\u1ea1o m\u01a1 h\u1ed3 t\u1eeb kh\u00e1ch h\u00e0ng', questions: questions.filter((item) => Number(item.code) >= 9 && Number(item.code) <= 11) },
      { title: 'Case 4: Thi\u1ebft k\u1ebf l\u1edbp h\u1ecdc cho m\u00f4i tr\u01b0\u1eddng nhi\u1ec1u c\u1ea5p b\u1eadc, nh\u1ea1y c\u1ea3m', questions: questions.filter((item) => Number(item.code) >= 12 && Number(item.code) <= 14) },
    ].filter((group) => group.questions.length);
  }

  return [{ title: '', questions }];
}

export function PublicLecturerAssessmentPage() {
  const params = useParams();
  const formId = params.formId || '';
  const [bundle, setBundle] = useState<LecturerAssessmentFormBundle | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [state, setState] = useState<PublicFormState>({
    lecturerName: '',
    email: '',
    phone: '',
    yearsTeaching: '',
    notes: '',
    answers: {},
  });

  const totalScore = useMemo(() => (bundle?.questions || []).reduce((sum, item) => sum + item.maxScore, 0), [bundle]);
  const hasScoring = totalScore > 0;

  useEffect(() => {
    void loadForm();
  }, [formId]);

  async function loadForm() {
    setLoading(true);
    setErrorMessage('');
    try {
      const nextBundle = formId ? await getAssessmentFormBundle(formId) : null;
      setBundle(nextBundle);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Kh\u00f4ng t\u1ea3i \u0111\u01b0\u1ee3c form gi\u1ea3ng vi\u00ean.');
    } finally {
      setLoading(false);
    }
  }

  function updateAnswer(code: string, value: string) {
    setState((current) => ({
      ...current,
      answers: {
        ...current.answers,
        [code]: value,
      },
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!bundle) return;

    setSubmitting(true);
    setErrorMessage('');
    try {
      await saveAssessmentSubmission({
        formId: bundle.form.id,
        lecturerName: state.lecturerName.trim(),
        email: state.email.trim(),
        phone: state.phone.trim(),
        yearsTeaching: state.yearsTeaching.trim(),
        notes: state.notes.trim(),
        answers: state.answers,
      });
      setSubmitted(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Kh\u00f4ng g\u1eedi \u0111\u01b0\u1ee3c b\u00e0i tr\u1ea3 l\u1eddi.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="public-game-page">
        <SectionHeader eye="Public Lecturer Form" title={'\u0110ang t\u1ea3i form'} subtitle={'Vui l\u00f2ng ch\u1edd trong gi\u00e2y l\u00e1t.'} />
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="public-game-page">
        <SectionHeader eye="Public Lecturer Form" title={'Kh\u00f4ng t\u00ecm th\u1ea5y form'} subtitle={'Link n\u00e0y kh\u00f4ng t\u1ed3n t\u1ea1i ho\u1eb7c \u0111ang t\u1eaft.'} />
        {errorMessage ? <div className="notice danger">{errorMessage}</div> : null}
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="public-game-page">
        <SectionHeader eye="Public Lecturer Form" title={'G\u1eedi c\u00e2u tr\u1ea3 l\u1eddi th\u00e0nh c\u00f4ng!'} subtitle={'Xin c\u1ea3m \u01a1n anh/ch\u1ecb!'} />
      </div>
    );
  }

  return (
    <div className="public-lecturer-page">
      <SectionHeader eye="Public Lecturer Form" title={bundle.form.title} subtitle={bundle.form.intro} />

      <div className="kpi-row small">
        <Kpi label={'B\u1ed9 c\u00e2u h\u1ecfi'} value={bundle.questionSet.name} sub={bundle.questionSet.code} tone="warning" />
        <Kpi label={'T\u1ed5ng c\u00e2u h\u1ecfi'} value={String(bundle.questions.length)} sub={'\u0110i\u1ec1n \u0111\u1ea7y \u0111\u1ee7 tr\u01b0\u1edbc khi g\u1eedi'} tone="danger" />
        <Kpi label={'T\u1ed5ng ph\u1ea7n'} value={String(bundle.sections.length)} sub={'Nh\u00f3m \u0111\u00e1nh gi\u00e1'} tone="violet" />
        <Kpi
          label={hasScoring ? 'Khung \u0111i\u1ec3m' : 'H\u00ecnh th\u1ee9c'}
          value={hasScoring ? String(totalScore) : 'T\u1ef1 lu\u1eadn'}
          sub={hasScoring ? 'D\u00e0nh cho h\u1ed9i \u0111\u1ed3ng' : 'Tr\u1ea3 l\u1eddi theo n\u1ed9i dung b\u1ed9 c\u00e2u h\u1ecfi'}
          tone="success"
        />
      </div>

      {errorMessage ? <div className="notice danger">{errorMessage}</div> : null}

      <form className="lecturer-public-form" onSubmit={handleSubmit}>
        {renderStructuredIntro(bundle.questionSet.code)}

        <Card title={'Th\u00f4ng tin gi\u1ea3ng vi\u00ean'}>
          <div className="form-grid">
            <label>
              <span>{'H\u1ecd v\u00e0 t\u00ean'}</span>
              <input required value={state.lecturerName} onChange={(event) => setState((current) => ({ ...current, lecturerName: event.target.value }))} />
            </label>
            <label>
              <span>Email</span>
              <input required type="email" value={state.email} onChange={(event) => setState((current) => ({ ...current, email: event.target.value }))} />
            </label>
            <label>
              <span>{'\u0110i\u1ec7n tho\u1ea1i'}</span>
              <input value={state.phone} onChange={(event) => setState((current) => ({ ...current, phone: event.target.value }))} />
            </label>
            <label>
              <span>{'S\u1ed1 n\u0103m kinh nghi\u1ec7m gi\u1ea3ng d\u1ea1y'}</span>
              <input value={state.yearsTeaching} onChange={(event) => setState((current) => ({ ...current, yearsTeaching: event.target.value }))} />
            </label>
            <label className="full">
              <span>{'Ghi ch\u00fa b\u1ed5 sung'}</span>
              <textarea rows={4} value={state.notes} onChange={(event) => setState((current) => ({ ...current, notes: event.target.value }))} />
            </label>
          </div>
        </Card>

        {bundle.sections.map((section) => (
          <Card
            key={section.id}
            title={`${section.code} \u00b7 ${section.title}`}
            action={section.maxScore > 0 ? <Badge tone={section.tone}>{`${section.maxScore} \u0111i\u1ec3m`}</Badge> : undefined}
          >
            <div className="lecturer-bank-question-stack">
              <div className="lecturer-section-banner">
                <div className="lecturer-section-banner-code">{section.code}</div>
                <div className="lecturer-section-banner-title">{section.title}</div>
                {section.subtitle ? <p>{section.subtitle}</p> : null}
              </div>

              {groupQuestionsForPublic(section.id, bundle.questionSet.code, getSectionQuestions(section.id, bundle.questions)).map((group) => (
                <div className="lecturer-bank-outline-group" key={`${section.id}-${group.title || 'root'}`}>
                  {group.title ? <div className="lecturer-bank-outline-case">{group.title}</div> : null}
                  {renderCaseContext(group.title, section.id, bundle.questionSet.code)}

                  <div className="lecturer-bank-question-stack">
                    {group.questions.map((question) => (
                      <article className="lecturer-bank-question" key={question.id}>
                        <div className="lecturer-bank-question-head">
                          <div>
                            <div className="lecturer-bank-question-code">{`C\u00e2u ${question.code}`}</div>
                            <h4>{question.title}</h4>
                          </div>
                          {question.maxScore > 0 ? <div className="lecturer-bank-question-score">/{question.maxScore}</div> : null}
                        </div>

                        <div className="lecturer-bank-question-body">
                          <div className="lecturer-bank-prompt-block">
                            <span className="lecturer-bank-label">{'N\u1ed9i dung c\u00e2u h\u1ecfi'}</span>
                            {renderQuestionPrompt(question, bundle.questionSet.code)}
                          </div>

                          <label className="lecturer-bank-inline-field">
                            <span>{'C\u00e2u tr\u1ea3 l\u1eddi c\u1ee7a gi\u1ea3ng vi\u00ean'}</span>
                            {section.id === 'mcq' ? (
                              <div className="lecturer-choice-list">
                                {extractMultipleChoiceOptions(question.prompt).map((option) => (
                                  <label className="lecturer-choice-item" key={`${question.id}-${option.key}`}>
                                    <input
                                      required
                                      type="radio"
                                      name={`question-${question.code}`}
                                      value={option.key}
                                      checked={(state.answers[question.code] || '') === option.key}
                                      onChange={(event) => updateAnswer(question.code, event.target.value)}
                                    />
                                    <span className="lecturer-choice-key">{option.key}</span>
                                    <span className="lecturer-choice-label">{option.label}</span>
                                  </label>
                                ))}
                              </div>
                            ) : (
                              <textarea
                                required
                                rows={6}
                                value={state.answers[question.code] || ''}
                                onChange={(event) => updateAnswer(question.code, event.target.value)}
                              />
                            )}
                          </label>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}

        <div className="form-actions">
          <button type="submit" className="button-primary" disabled={submitting}>
            {submitting ? '\u0110ang g\u1eedi...' : 'G\u1eedi c\u00e2u tr\u1ea3 l\u1eddi'}
          </button>
        </div>
      </form>
    </div>
  );
}

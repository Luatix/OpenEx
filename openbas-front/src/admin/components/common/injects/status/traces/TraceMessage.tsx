import { type ExecutionTracesOutput } from '../../../../../../utils/api-types';

interface Props {
  traces: ExecutionTracesOutput[];
}

const TraceMessage = ({ traces }: Props) => {
  return (
    <pre style={{ marginTop: '5px' }}>
      {traces.length > 1 ? (
        <ul>
          {traces.sort((a, b) => new Date(a.execution_time).getTime() - new Date(b.execution_time).getTime()).map((tr, index) => (
            <li key={index}>
              {tr.execution_status}
              {' '}
              {tr.execution_message}
            </li>
          ))}
        </ul>
      ) : (
        traces.map(tr => `${tr.execution_status} ${tr.execution_message}`)
      )}
    </pre>
  );
};
export default TraceMessage;

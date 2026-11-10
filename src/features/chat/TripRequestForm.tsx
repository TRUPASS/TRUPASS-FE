import { useState, type FormEvent } from 'react';

interface Props {
  onSubmit: (message: string) => void;
  isPending?: boolean;
}

/** 자연어 여행 요청 입력 (디자인 없음) */
export function TripRequestForm({ onSubmit, isPending = false }: Props) {
  const [message, setMessage] = useState('다음 달에 오사카 2박 3일 다녀오고 싶어');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (message.trim()) onSubmit(message.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label htmlFor="trip-message">어디로 떠나고 싶으세요?</label>
      <textarea
        id="trip-message"
        className="border p-2"
        rows={3}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button type="submit" className="border px-3 py-1" disabled={isPending}>
        {isPending ? '요청 중…' : '패키지 만들어줘'}
      </button>
    </form>
  );
}

export const campaign = {
  price: 800,
  year: 2026,
  towns: [
    { id: 'rassokha', name: 'Рассоха', day: 7, date: '2026-11-07', weekday: 'Суббота' },
    { id: 'verkhnee-dubrovo', name: 'Верхнее Дуброво', day: 8, date: '2026-11-08', weekday: 'Воскресенье' },
    { id: 'aramil', name: 'Арамиль', day: 9, date: '2026-11-09', weekday: 'Понедельник' },
    { id: 'kosulino', name: 'Косулино', day: 10, date: '2026-11-10', weekday: 'Вторник' },
  ],
} as const;
export function validateBooking(data: Record<string, unknown>, now = new Date()) {
  const town = campaign.towns.find(t => t.id === data.town);
  if (!town) return { error: 'Выберите населённый пункт из списка.' };
  if (now.getTime() > Date.parse(`${town.date}T18:00:00+05:00`)) return { error: 'Запись на этот выезд завершена.' };
  let phone = typeof data.phone === 'string' ? data.phone.replace(/\D/g, '') : '';
  if (phone.length === 10) phone = '7' + phone;
  if (phone.startsWith('8')) phone = '7' + phone.slice(1);
  if (!/^7\d{10}$/.test(phone)) return { error: 'Укажите телефон полностью: +7 и ещё 10 цифр.' };
  const address = typeof data.address === 'string' ? data.address.trim().replace(/\s+/g, ' ') : '';
  if (address.length < 5 || address.length > 250) return { error: 'Укажите улицу и номер дома (от 5 до 250 символов).' };
  if (data.consent !== true) return { error: 'Для записи необходимо согласие на обработку данных.' };
  if (typeof data.requestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.requestId)) return { error: 'Обновите страницу и отправьте заявку ещё раз.' };
  if (data.website) return { error: 'Не удалось отправить заявку. Свяжитесь с нами по телефону.' };
  return { value: { town, phone: '+' + phone, address, requestId: data.requestId } };
}

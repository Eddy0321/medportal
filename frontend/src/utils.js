export const getUnique = (currencies) => {
  const uniqueArray = [];
  currencies.forEach(element => {
    if (!uniqueArray.some((v) => v.currency === element.currency)) {
      if (element.currency && element.currency !== '') uniqueArray.push(element);
    }
  });

  return uniqueArray;
}
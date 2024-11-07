//@ts-check
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import express from 'express';
const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

/* review
  Почему-то для всего файла не было выполнено форматирование кода
  я не могу понять причину этого, и как на это реагировать.

  Так же почему то много объявлений стрелочных функций.
  Кажется что так были объявлены только async функции
  Хотя вместо этого можно использовать async function fnName(){...}

  По самой задаче
  Дата из ответа сохраняется в базе данных как строка, а не как дата.
  Числовые коэффициенты полученные от api в виде строк, но по сути являющиеся числами, так же не преобразованы в числа.

*/

// Функция для получения текущей даты
function getCurrentDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}


// Эта функция получает данные по api, помещает их в базу данных или обновляет значения по условию
const fetchData = async () => {
  try {
    const currentDate = String(getCurrentDate());
    const headers = {
      'Authorization': 'eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjQwNjE3djEiLCJ0eXAiOiJKV1QifQ.eyJlbnQiOjEsImV4cCI6MTczNjIzODAzNSwiaWQiOiJjNWNhZTdhNC02Y2IyLTRlM2ItOGU5Zi1hODc5NzdkYjUzMzgiLCJpaWQiOjI2MzMyMDAyLCJvaWQiOjEzNDU1NzQsInMiOjEwNzM3NDU5MTgsInNpZCI6ImZjNWUzNjdlLWE2MGMtNGE2Ny1hNmQ0LTNiNjYzNmRkOGRlOCIsInQiOmZhbHNlLCJ1aWQiOjI2MzMyMDAyfQ.VUQ97uc6mHq4iHlBQy1vvvm5BRl3jcIExWiCOKIYaYzX650TE6GakYTcawUmO6-DCJ39vHyHYa7m9FShvu_rOg'
    };
    const params = {
      'date': currentDate
    };
    // Запрос к API
    const response = await axios.get("https://common-api.wildberries.ru/api/v1/tariffs/box", { headers, params });
    if (response.status === 200) {
      const data = response?.data?.response?.data;
      let newItems = data.warehouseList;
      // При первом запросебудут созданы новые записи
      await createAndUpdateData(newItems);

    }
  } catch (error) {
    /* review
      видно что есть обработка ошибок получения данных 
      но не уделено внимание возможным ошибкам вставки данных
      думаю имело бы смысл разделить часть с получением данных от WB и часть с вставкой данные в разные try/catch
    */
    if (error.response) {
      // Обработка ошибок на основе кода ответа
      switch (error.response.status) {
        case 400:
          console.error('Ошибка 400: Неправильный запрос.');
          break;
        case 401:
          console.error('Ошибка 401: Пользователь не авторизован.');
          break;
        case 403:
          console.error('Ошибка 403: Доступ запрещен.');
          break;
        case 404:
          console.error('Ошибка 404: Адрес не найден.');
          break;
        case 429:
          console.error('Ошибка 429: Слишком много запросов.');
          break;
        default:
          console.error('Неизвестная ошибка:', error.response.status);
      }
    } else {
      // Обработка ошибок сети или другие ошибки
      console.error('Ошибка сети или другая ошибка:', error.message);
    }
  }
}

// Функция для сравнения объектов, исключая поле date
function compareObjects(obj1, obj2) {
  for (const key in obj1) {
    if (key !== 'date') {
      /*review
        nitpick: в данном случае было бы удобнее воспользоваться if (key !== 'date') continue;
      */
      if (obj1[key] !== obj2[key]) {
        return false;
      }
    }
  }
  return true;
}

// Эта функция получает данные, прогоняет их в цикле и передает в функцию с методом обновления/создания prisma
const createAndUpdateData = async (items) => {
  let date = String(getCurrentDate());
  await items.forEach(async (item) => {
    /*review
      должно было быть как то так
      await props.forEach(async (item) => {
      либо нужно было просто использовать обычный for цикл
    */
    const {
      warehouseName,
      boxDeliveryAndStorageExpr,
      boxDeliveryBase,
      boxDeliveryLiter,
      boxStorageBase,
      boxStorageLiter
    } = item;

    /*review
      в данном случае upsertFunction это асинхронная функция, но forEach не ждет её завершения
      скорее всего это баг, а не фича
      await upsertFunction(

    */
    await upsertFunction({
      date,
      warehouseName: String(warehouseName),
      boxDeliveryAndStorageExpr: String(boxDeliveryAndStorageExpr),
      boxDeliveryBase: String(boxDeliveryBase),
      boxDeliveryLiter: String(boxDeliveryLiter),
      boxStorageBase: String(boxStorageBase),
      boxStorageLiter: String(boxStorageLiter)
    });
  });
}

/*review
  не совсем понятна мотивация в объявлении функции через const
  еще не совсем понятен момент почему в данной функции не принять объект с деструктуризацией

  если рассматривать саму функцию то судя по названию, она должна только вставлять данные в базу
  но фактически мы видим нарушение границ ответственности, когда функция также дополняет данные
*/

// Если дата текущая, данные обновятся, иначе будет создана новая запись
const upsertFunction = async (item) => {
  const {
    date,
    warehouseName,
    boxDeliveryAndStorageExpr,
    boxDeliveryBase,
    boxDeliveryLiter,
    boxStorageBase,
    boxStorageLiter
  } = item;
  const updatedUser = await prisma.warehouseData.upsert({
    where: {
      warehouseName_date: {
        warehouseName: warehouseName,
        /*review
          currentDate всегда будет равно дате запуска скрипта, т.к он объявлен в начале скрипта
        */
        date,
      },
    },
    update: { boxDeliveryAndStorageExpr, boxDeliveryBase, boxDeliveryLiter, boxStorageBase, boxStorageLiter, },
    create: item,
  });
}

app.get('/test', async (req, res) => {
  try {
    /* review
      немного странный подход.
      на крайний случай можно было поместить это внутрь app.listen
      хотя правильнее было бы просто вызвать этот код после app.listen
    */
    fetchData();
    setInterval(fetchData, 60000);

    res.status(200).json({ message: 'success' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/test3', async (req, res) => {
  try {

    const result = await prisma.warehouseData.findMany();

    res.status(200).json({ message: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



//start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
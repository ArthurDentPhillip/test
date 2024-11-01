import axios from 'axios';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import express from 'express';
const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods','GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});



let data;
let count = 0;
let compareResult;

// Функция для получения текущей даты
function getCurrentDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); 
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

let currentDate = String(getCurrentDate());

// Эта функция получает данные по api, помещает их в базу данных или обновляет значения по условию
const fetchData = async () => {
  try{
 const headers = {
  'Authorization': 'eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjQwNjE3djEiLCJ0eXAiOiJKV1QifQ.eyJlbnQiOjEsImV4cCI6MTczNjIzODAzNSwiaWQiOiJjNWNhZTdhNC02Y2IyLTRlM2ItOGU5Zi1hODc5NzdkYjUzMzgiLCJpaWQiOjI2MzMyMDAyLCJvaWQiOjEzNDU1NzQsInMiOjEwNzM3NDU5MTgsInNpZCI6ImZjNWUzNjdlLWE2MGMtNGE2Ny1hNmQ0LTNiNjYzNmRkOGRlOCIsInQiOmZhbHNlLCJ1aWQiOjI2MzMyMDAyfQ.VUQ97uc6mHq4iHlBQy1vvvm5BRl3jcIExWiCOKIYaYzX650TE6GakYTcawUmO6-DCJ39vHyHYa7m9FShvu_rOg'
 };
const params = {
'date': currentDate
};
// Запрос к API
const response = await axios.get("https://common-api.wildberries.ru/api/v1/tariffs/box", { headers, params }); 

if(response.status===200){
data = response?.data?.response?.data;
let warehouses = data.warehouseList;

// При первом запросебудут созданы новые записи
if(count===0){
  createAndUpdateDb(warehouses);
}
// При следующих запросах, если дата текущая, данные провреяются на совпадение из базы данных и если они не совпадают, т. е. изменились, данные обновляются
// Если дата не текущая, добавляется новая запись
else{
  let arrayBd = await prisma.warehouseData.findMany();
arrayBd.forEach(item => {
  if(item.date == currentDate){
    arrayBd.forEach((obj1, index1) => {
      warehouses.forEach((obj2, index2) => {
        const areEqual = compareObjects(obj1, obj2);
        if(areEqual){
          compareResult = true;
        }
        else{
          compareResult = false;
        }
      });
    });
    if(!compareResult){
      createAndUpdateDb(warehouses);
    }
  }
  else{
    createAndUpdateDb(warehouses);
  }
});
}
count = count + 1;
}
}catch(error){
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
      if (obj1[key] !== obj2[key]) {
        return false;
      }
    }
  }
  return true;
}

// Эта функция получает данные, прогоняет их в цикле и передает в функцию с методом обновления/создания prisma
const createAndUpdateDb = async (props) => {
    props.forEach(item => {
    const {
      warehouseName,
      boxDeliveryAndStorageExpr,
      boxDeliveryBase,
      boxDeliveryLiter,
      boxStorageBase,
      boxStorageLiter
    } = item;

    upsertFunction(
      String(warehouseName),
      String(boxDeliveryAndStorageExpr),
      String(boxDeliveryBase),
      String(boxDeliveryLiter),
      String(boxStorageBase),
      String(boxStorageLiter)
    );
  });
}

// Если дата текущая, данные обновятся, иначе будет создана новая запись
const upsertFunction = async (
  warehouseName, 
  boxDeliveryAndStorageExpr, 
  boxDeliveryBase, 
  boxDeliveryLiter, 
  boxStorageBase,
  boxStorageLiter
) => {

  const updatedUser = await prisma.warehouseData.upsert({
    where: {
      warehouseName_date: {
        warehouseName: warehouseName,
        date: currentDate,
      },
    },
    update: {
      boxDeliveryAndStorageExpr: boxDeliveryAndStorageExpr,
      boxDeliveryBase: boxDeliveryBase,
      boxDeliveryLiter: boxDeliveryLiter,
      boxStorageBase: boxStorageBase,
      boxStorageLiter: boxStorageLiter,
    },
    create: {
      boxDeliveryAndStorageExpr: boxDeliveryAndStorageExpr,
      boxDeliveryBase: boxDeliveryBase,
      boxDeliveryLiter: boxDeliveryLiter,
      boxStorageBase: boxStorageBase,
      boxStorageLiter: boxStorageLiter,
      warehouseName: warehouseName, 
      date: currentDate,
    },
  });
}

app.get('/test', async (req, res) => {
  try {
    fetchData();
    setInterval(fetchData, 60000);
   
  res.status(200).json({ message: 'success'});
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
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

// Функция для получения текущей даты
function getCurrentDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); 
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

let currentDate = String(getCurrentDate());

const fetchData = async () => {
  try{
 const headers = {
  'Authorization': 'eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjQwNjE3djEiLCJ0eXAiOiJKV1QifQ.eyJlbnQiOjEsImV4cCI6MTczNjIzODAzNSwiaWQiOiJjNWNhZTdhNC02Y2IyLTRlM2ItOGU5Zi1hODc5NzdkYjUzMzgiLCJpaWQiOjI2MzMyMDAyLCJvaWQiOjEzNDU1NzQsInMiOjEwNzM3NDU5MTgsInNpZCI6ImZjNWUzNjdlLWE2MGMtNGE2Ny1hNmQ0LTNiNjYzNmRkOGRlOCIsInQiOmZhbHNlLCJ1aWQiOjI2MzMyMDAyfQ.VUQ97uc6mHq4iHlBQy1vvvm5BRl3jcIExWiCOKIYaYzX650TE6GakYTcawUmO6-DCJ39vHyHYa7m9FShvu_rOg'
 };
const params = {
'date': currentDate
};
const response = await axios.get("https://common-api.wildberries.ru/api/v1/tariffs/box", { headers, params }); 

if(response.status===200){
data = response?.data?.response?.data;
// При первом запуске скрипта
if(count===0){
  addToDb();
}
// Обновление данных
else{
  deleteDb();
  addToDb();
}
count=count+1;
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

// Функция для добавления данных в базу данных
const addToDb = async () => {
  const warehouses = data.warehouseList
  for (const warehouse of warehouses) {
    const updateUser = await prisma.warehouseData.create({
      data: {
        boxDeliveryAndStorageExpr: warehouse.boxDeliveryAndStorageExpr,
                  boxDeliveryBase: warehouse.boxDeliveryBase,
                  boxDeliveryLiter: warehouse.boxDeliveryLiter,
                  boxStorageBase: warehouse.boxStorageBase,
                  boxStorageLiter: warehouse.boxStorageLiter,
                  warehouseName: warehouse.warehouseName, 
      }
    });
}
}

// Функция для удаления данных из базы данных
const deleteDb = async () => {
  const deleteUsers = await prisma.warehouseData.deleteMany({})
}

app.get('/test', async (req, res) => {
  try {
   fetchData();
// setInterval для обновления данных каждую минуту
  setInterval(fetchData, 60000);
   
    res.status(200).json({ message: currentDate });
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
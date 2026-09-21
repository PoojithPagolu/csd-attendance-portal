from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import sqlite3, json, os, hashlib, hmac
from datetime import datetime, date
from zoneinfo import ZoneInfo

INDIA_TZ = ZoneInfo("Asia/Kolkata")

def india_now():
    return datetime.now(INDIA_TZ)

ROOT = os.path.dirname(os.path.abspath(__file__))
DB = os.path.join(ROOT, 'attendance.db')

SEED_STUDENTS = []  # Year-1 demo roster is intentionally empty.

# Real department student lists. Phone numbers are intentionally not stored here.
STUDENT_DATA = {
    (2, 'A'): [
    ('25X41A4401', 'ARDHALA VENKATA KRISHNA'),
    ('25X41A4402', 'ATHMAKURI ANURADHA'),
    ('25X41A4403', 'BILLAGURTHI HEMASRI'),
    ('25X41A4404', 'BOMMALA NAGA SAI'),
    ('25X41A4405', 'CHALAMALA SAI CHARAN'),
    ('25X41A4406', 'CHALLARI BHUVAN SAI KUMAR'),
    ('25X41A4407', 'CHOPPARA AKSHAYA'),
    ('25X41A4408', 'DAMERLA LOKESH'),
    ('25X41A4409', 'DASAM DEVI HANSIKA'),
    ('25X41A4410', 'DOKKU GURU CHARAN'),
    ('25X41A4411', 'DONE RITHWIK'),
    ('25X41A4412', 'GALI RUPA SRI NANDINI'),
    ('25X41A4413', 'GANTA VINAY'),
    ('25X41A4414', 'GORANTLA YASWANTH'),
    ('25X41A4415', 'GUDE SRUTHI'),
    ('25X41A4416', 'GULIPALLI PARVATHI SAI MANOJ KUMAR'),
    ('25X41A4417', 'GUMMIDI DEENA'),
    ('25X41A4418', 'GUNDE DEVI AKSHITHA'),
    ('25X41A4419', 'KALAPALA AKSHAYA'),
    ('25X41A4420', 'KAMINENI YUGANDHAR VENKATA DURGA ESWAR'),
    ('25X41A4421', 'KASIMIKOTA CHARAN TEJA'),
    ('25X41A4422', 'KOLLI DEVASAI'),
    ('25X41A4423', 'KOTHA NIKHIL'),
    ('25X41A4424', 'KUDETI YASASWI'),
    ('25X41A4425', 'LAKKAPRAGADA LIKHIT VENKAT RAM'),
    ('25X41A4426', 'LENKA LOKESH VEERA PATRUDU'),
    ('25X41A4427', 'MADA GAYATRI LAKSHMI'),
    ('25X41A4428', 'MAHALI BHARGAV KRISHNA'),
    ('25X41A4429', 'MALAPATI KARTHIK'),
    ('25X41A4430', 'MALLAMPALLI NIKHILA SRUTHA KEERTHI'),
    ('25X41A4431', 'MARRI CHARISHMA SAI'),
    ('25X41A4432', 'MEDISETTI RAMA CHANDRIKA'),
    ('25X41A4433', 'MOHAMMAD ABDUL JAHANGEER'),
    ('25X41A4434', 'MOHAMMAD KHYSAR SULTANA'),
    ('25X41A4435', 'MOHAMMAD SHAHID AHAMMAD'),
    ('25X41A4436', 'MOHAMMAD SUMIYA'),
    ('25X41A4437', 'MOHAMMED ZAHIRUDDEEN'),
    ('25X41A4438', 'MUDIGONDLA JAGRUTHI SOWMYA'),
    ('25X41A4439', 'MUKKOLLU RAJESH'),
    ('25X41A4440', 'MUSUGU VENKATA PUNEETH'),
    ('25X41A4441', 'NALLAGANCHU VENKATA KRISHNA VAMSI'),
    ('25X41A4442', 'NALLAJERLA GOWTHAM'),
    ('25X41A4443', 'PAMARTHI DEEPIKA'),
    ('25X41A4444', 'PANDRAJU NITHIN SAI CHANDRA'),
    ('25X41A4445', 'RAYAPUDI DEVARAJU'),
    ('25X41A4446', 'RUKUM POOJITHA'),
    ('25X41A4447', 'SHAIK JAHEER SAHEB'),
    ('25X41A4448', 'SHAIK MOHAMED MERAJUDDIN'),
    ('25X41A4449', 'SIDDHINENI JASWANTH'),
    ('25X41A4450', 'SUNKARA DEEPIKA'),
    ('25X41A4451', 'SURA ARUP'),
    ('25X41A4452', 'SYED JANNATUL FIRDAUS'),
    ('25X41A4453', 'TALLA SARANYA'),
    ('25X41A4454', 'TANNI PAVAN'),
    ('25X41A4456', 'THAMMINENI SWARNA PRIYA'),
    ('25X41A4457', 'TUMMALA BHARATH KUMAR'),
    ('25X41A4458', 'VEERABOINA BABY JASMIN'),
    ('25X41A4459', 'VEMULAPALLI KUSHAL'),
    ('25X41A4460', 'VIPPARLA DURGA PRASAD'),
    ('25X41A4461', 'VISSAMSETTI NEHANTH KUMAR'),
    ('25X41A4462', 'VUYYURU MAHESH NADH'),
    ('25X41A4463', 'VUYYURU PRANAV'),
    ('25X41A4464', 'YANAMALA SUHAS'),
    ('25X41A4465', 'YENUGU SAI REVANTH'),
    ('25X41A4466', 'YERRABOYINA SAI TEJA'),
],
    (2, 'B'): [
    ('25X41A4467', 'ADEPU GIRI BABU'),
    ('25X41A4468', 'ALIBILLI LOKESH'),
    ('25X41A4469', 'AMPOLU MOHAN'),
    ('25X41A4470', 'ARETHOTI AJAY'),
    ('25X41A4471', 'BADAM NAGA JYOTHI'),
    ('25X41A4472', 'BALAGAMSETTI ASWITHA'),
    ('25X41A4473', 'BELLAM NEHA CHOWDARY'),
    ('25X41A4474', 'CHALUMURI SANGEETHA'),
    ('25X41A4475', 'CHINTALACHERUVU MANASA'),
    ('25X41A4476', 'DAMARLA SAMBA SIVA RAO'),
    ('25X41A4477', 'DASARI KALYAN BABU'),
    ('25X41A4478', 'DONDAPATI SUJITH'),
    ('25X41A4479', 'ELURU PAVAN KUMAR'),
    ('25X41A4480', 'GANDHAVARAPU NAGA LAKSHMI'),
    ('25X41A4481', 'GUDAPATI ESHANTH'),
    ('25X41A4482', 'IMMANDI JAIDEEP SAI'),
    ('25X41A4483', 'INTURI HANISH'),
    ('25X41A4484', 'J.V.HEMANTH KUMAR REDDY'),
    ('25X41A4485', 'KARADI PRAVEENA'),
    ('25X41A4486', 'KARUMANCHI KARUN PRAKASH'),
    ('25X41A4487', 'KATARI MAHALAKSHMI'),
    ('25X41A4488', 'KAYALA BRAHMANI'),
    ('25X41A4489', 'KODALI SAMPATH'),
    ('25X41A4490', 'KUNDRAPU YAMINI'),
    ('25X41A4491', 'KUVVARAPU KEERTHI'),
    ('25X41A4492', 'LAVU ADITYA VARDHAN'),
    ('25X41A4493', 'LODA YOGENDRA'),
    ('25X41A4494', 'MAHAMMAD REHAN ALAM'),
    ('25X41A4495', 'MAJJI SAI'),
    ('25X41A4496', 'MEDAM VASANTHA LAKSHMI'),
    ('25X41A4497', 'MEKALA ADBUTH KUMAR'),
    ('25X41A4498', 'MEKALA JITHIN'),
    ('25X41A4499', 'MOHAMMAD JAVID AMAMMAD'),
    ('25X41A44A0', 'MUNDURU JYOTHIRMAYEE'),
    ('25X41A44A1', 'ODUGU HEMA SAI'),
    ('25X41A44A2', 'ORUGANTI SALINI'),
    ('25X41A44A3', 'PALADUGU PRATAP BABU'),
    ('25X41A44A4', 'PALAGANI MANIKANTA'),
    ('25X41A44A5', 'PANDU DINESH'),
    ('25X41A44A6', 'PARVATABOYINA NAGARAJU'),
    ('25X41A44A7', 'PASEM AKSHYA BHAVANI MAHALAKSHMI'),
    ('25X41A44A8', 'PASUPU REDDY SRAVANI'),
    ('25X41A44A9', 'PATHAN SILAR KHAN'),
    ('25X41A44B0', 'PENDEM CHAKRITHA'),
    ('25X41A44B1', 'PILLI AKSHAYA'),
    ('25X41A44B2', 'PINNINTI BRAHMANI VARMA'),
    ('25X41A44B3', 'PULA CHANDU BABU'),
    ('25X41A44B4', 'PULIVARTHI SUBHASHBABU'),
    ('25X41A44B5', 'PUPPALA DHANUSH'),
    ('25X41A44B6', 'PUPPALA GOWRI SRI ANUSHKA'),
    ('25X41A44B7', 'RAYI RAM CHARAN'),
    ('25X41A44B8', 'SANGARAJU BHARATH'),
    ('25X41A44B9', 'SHAIK ABBAS'),
    ('25X41A44C0', 'SHAIK KASHIFA RAHAMATH'),
    ('25X41A44C1', 'SHAIK KHASIM VALI'),
    ('25X41A44C2', 'SHAIK SUBHANI'),
    ('25X41A44C3', 'SIYADRI VISHNU VARDHAN'),
    ('25X41A44C4', 'SOMAYAJULA VENKATA SUNITHA DEVI'),
    ('25X41A44C5', 'UPPALANCHU NAGA MAHESWARI'),
    ('25X41A44C6', 'UPPATHALLA PRAKASH RAJ'),
    ('25X41A44C7', 'VADLAMUDI SANJANA'),
    ('25X41A44C8', 'YERROJU DEVENDRA VEERABRAHMAM'),
],
    (3, 'A'): [
    ('24X41A4401', 'ABDUL HAMEED'),
    ('24X41A4402', 'ABHIMALLA BINDU HASINI'),
    ('24X41A4403', 'ALAPATI HIMA KEERTHI'),
    ('24X41A4404', 'ALLA VISHNU KUMAR REDDY'),
    ('24X41A4405', 'ANNEBOINA HARI'),
    ('24X41A4406', 'BANAVATHU TRIVIKRAMLAL NAIK'),
    ('24X41A4407', 'BANDARU SWANITHA'),
    ('24X41A4408', 'BANKAPALLI SUNEETHA'),
    ('24X41A4409', 'BUDISETLA HEMA BINDHU'),
    ('24X41A4410', 'BURRAMUKKU HARSHITHA'),
    ('24X41A4411', 'CHINTHALA AMALESWARI'),
    ('24X41A4412', 'CHITTURI SWATHI SRI'),
    ('24X41A4413', 'CHODAVARAPU SYAM VENKATA GOWRINAD'),
    ('24X41A4414', 'DHAVULURI SINDHU'),
    ('24X41A4415', 'DOMATHOTI HEMANTH'),
    ('24X41A4416', 'DUGGEMPUDI VENKATA THIRUPATHI REDDY'),
    ('24X41A4417', 'DUNNA PRIYANKA'),
    ('24X41A4418', 'EDARA DINESH'),
    ('24X41A4419', 'GADDAM MYTHRI'),
    ('24X41A4420', 'GAVARA RAHUL BABU'),
    ('24X41A4421', 'GOLI PUJITHA'),
    ('24X41A4422', 'GOLLA MAHESWARI'),
    ('24X41A4423', 'GUDAPATI NIKHITA'),
    ('24X41A4424', 'GURRAM ISWARYA'),
    ('24X41A4425', 'GURRAM JAHNAVI'),
    ('24X41A4426', 'ILLAPU SOWMYA'),
    ('24X41A4427', 'ITIKALA AMULYA'),
    ('24X41A4428', 'JALADI SUJAN SAI'),
    ('24X41A4429', 'JONNAKUTI BHUMIKA'),
    ('24X41A4430', 'K.NAGA SAI VARDHAN'),
    ('24X41A4431', 'KALAKOTA VARSHINI REDDY'),
    ('24X41A4432', 'KALLAGUNTA EESWAR'),
    ('24X41A4433', 'AYYANKI SANJANA'),
    ('24X41A4434', 'KATTA TRIVENI'),
    ('24X41A4435', 'KATTEPOGU SURENDRA'),
    ('24X41A4436', 'KOMMURI ABHISHEK'),
    ('24X41A4437', 'KONDA SAI SUDARSANA REDDY'),
    ('24X41A4438', 'KONDAVEETY SAI RAJA PRANAV'),
    ('24X41A4439', 'KOTA ARAVINDA MANOHAR'),
    ('24X41A4440', 'KOTHA KARTHIK'),
    ('24X41A4441', 'KOTHAPALLI ABHIGNA'),
    ('24X41A4442', 'MADIREDDI KAVYA'),
    ('24X41A4443', 'MANDADA CHARITHA'),
    ('24X41A4444', 'MANEM VEERENDRA SRI NAG'),
    ('24X41A4445', 'MOHAMMED RIZWAN'),
    ('24X41A4446', 'MORAMPUDI BHARGAVI'),
    ('24X41A4447', 'MUNGARA EESWARI'),
    ('24X41A4448', 'MURUDUDDI ARAVIND'),
    ('24X41A4449', 'MYLAVARAPU JAGADEESH'),
    ('24X41A4450', 'PALNATI VEERACHARAN'),
    ('24X41A4451', 'PASUPULETI SAMEERA'),
    ('24X41A4452', 'PATAKULA SAI KIRAN'),
    ('24X41A4453', 'PENKI GAYATHRI'),
    ('24X41A4454', 'PILLADI NAGA PRABHA YASHMITHA KRISHNA'),
    ('24X41A4455', 'PINNIBOYINA NAGA PRADEEP'),
    ('24X41A4456', 'SAIDU SUBHASH'),
    ('24X41A4457', 'SHAIK RAHAMTUNNISA'),
    ('24X41A4458', 'SHAIK SAJIDA'),
    ('24X41A4459', 'SUDABATTULA NEHASWI'),
    ('24X41A4460', 'SYED AKRAM ALI'),
    ('24X41A4461', 'T.MOHIT'),
    ('24X41A4462', 'T.SANTHI RAJU'),
    ('24X41A4463', 'TEJASWINI DANDIBOYINA'),
    ('24X41A4464', 'UMMADI SINGH HARSHA VARDHINI'),
    ('24X41A4465', 'VADLAMUDI VENKATESWARA SWAMY'),
    ('24X41A4466', 'VANGAVETI S N V L S R VARENYA'),
    ('25X45A4401', 'ABDUL AKMAL MUBARAK'),
    ('25X45A4402', 'BALIPILLI NAGA LAKSHMI NARASIMHA'),
    ('25X45A4403', 'BETHAPUDI BENNY EPHRAIM'),
    ('25X45A4404', 'CHAVALI SRIVALLI'),
    ('25X45A4405', 'DULLA AKSHAYA SRI'),
    ('25X45A4406', 'GORLE GUNA SEKHAR'),
    ('25X45A4407', 'MALLADI RAM TEJA'),
],
    (3, 'B'): [
    ('24X41A4467', 'A.S.Iswarya'),
    ('24X41A4469', 'K. Nagasai'),
    ('24X41A4470', 'B.Swapna'),
    ('24X41A4471', 'B.Chaitanya'),
    ('24X41A4472', 'CH.Dhana lakshmi'),
    ('24X41A4473', 'CH.Manish babu'),
    ('24X41A4474', 'CH.Bhargavi'),
    ('24X41A4475', 'CH.Krishna kumar'),
    ('24X41A4476', 'nikileshwar'),
    ('24X41A4478', 'D.Shameera'),
    ('24X41A4479', 'G.Rama Manikant Sai'),
    ('24X41A4480', 'G.Govindh Prasadh'),
    ('24X41A4481', 'G.Naga Manikanta'),
    ('24X41A4482', 'G.G.Koushik'),
    ('24X41A4483', 'J.Manoghna'),
    ('24X41A4484', 'J.Rupasri'),
    ('24X41A4485', 'J.Hemalatha'),
    ('24X41A4486', 'K.Dhanalakshmi'),
    ('24X41A4487', 'K.Amrutha Varshini'),
    ('24X41A4488', 'k.Dinesh Vardhan'),
    ('24X41A4489', 'K.Prudhvi'),
    ('24X41A4490', 'K.sai venkat'),
    ('24X41A4491', 'K.Haneesha'),
    ('24X41A4492', 'K.Naga bhanu prakash'),
    ('24X41A4493', 'L.Rakesh'),
    ('24X41A4494', 'M.Susmitha'),
    ('24X41A4495', 'M.Faizi Hasan'),
    ('24X41A4496', 'M.Seetha siri'),
    ('24X41A4497', 'Md.Mutharunnisa'),
    ('24X41A4498', 'Md.Riyaz'),
    ('24X41A4499', 'M.Sravya'),
    ('24X41A44A0', 'N.Mallikarjun'),
    ('24X41A44A1', 'N.Sruthi navya madhuri'),
    ('24X41A44A2', 'N.Kalpana'),
    ('24X41A44A3', 'N.Padmasree'),
    ('24X41A44A4', 'N.Sai'),
    ('24X41A44A5', 'P.Rohan Raghava'),
    ('24X41A44A6', 'P.Poojith'),
    ('24X41A44A7', 'P.Prince babu'),
    ('24X41A44A8', 'P.Poojitha'),
    ('24X41A44B0', 'P.Meghana'),
    ('24X41A44B2', 'R.Greeshmanth'),
    ('24X41A44B3', 'S.Venkateswarlu'),
    ('24X41A44B4', 'Ssatyanarayana'),
    ('24X41A44B5', 'S.Ramya sree'),
    ('24X41A44B6', 'S.Jahnavi'),
    ('24X41A44B7', 'T.Mahesh babu'),
    ('24X41A44B8', 'T.Kusuma kumari'),
    ('24X41A44B9', 'T.Sai prasana kumar'),
    ('24X41A44C0', 'T.Varshitha'),
    ('24X41A44C1', 'T.Venkat prudhvi'),
    ('24X41A44C3', 'V.Chandu'),
    ('24X41A44C5', 'V.Bhanu teja'),
    ('24X41A44C6', 'Y.Sadvik'),
    ('24X41A44C7', 'Y.Venkatacharyulu'),
    ('24X41A44C8', 'P.Rakesh'),
    ('24X41A44C9', 'K.Prakash'),
    ('25X45A4408', 'M.Sai teja'),
    ('25X45A4409', 'M.Sri Harsha'),
    ('25X45A4410', 'N.Bleson'),
    ('25X45A4411', 'P.Jithendra'),
    ('25X45A4412', 'P.Pavan ganesh'),
    ('25X45A4413', 'P.Althaf Khan'),
    ('25X45A4414', 'S.Tejo Sriram'),
    ('25X45A4415', 'V.Venkata Anil Kumar'),
    ('25X45A4416', 'K.Kiran'),
],
    (4, 'A'): [
    ('23X41A4401', 'Aadirala Shirisha'),
    ('23X41A4402', 'Ariveni Hema Sri'),
    ('23X41A4403', 'Arja Jyothi Sri'),
    ('23X41A4404', 'A. Varshitha Lakshmi Durga'),
    ('23X41A4405', 'Bachhala Venkata Sri Krishna'),
    ('23X41A4406', 'Baddapu Sai Krishna'),
    ('23X41A4407', 'Banavathu Rishi Naik'),
    ('23X41A4409', 'Betala Kinnera'),
    ('23X41A4410', 'Bezawada Anusha'),
    ('23X41A4411', 'Bezawada Jahnavi'),
    ('23X41A4412', 'Challa Gayathri Sukanya'),
    ('23X41A4414', 'Chandu Venkata Navya'),
    ('23X41A4416', 'Devarla Ramya Sri'),
    ('23X41A4417', 'Done Meghanadh'),
    ('23X41A4419', 'Duvvada Yashwanth Damodar'),
    ('23X41A4420', 'Duvvapu Madhavi'),
    ('23X41A4421', 'Ganta Pavan'),
    ('23X41A4422', 'Goriparti Naga Prasanna'),
    ('23X41A4423', 'Guggilla Naga Ambika'),
    ('23X41A4424', 'Guntaka Bhavya Spurthi'),
    ('23X41A4425', 'Gurram Sandeep'),
    ('23X41A4426', 'Jangam Mithil'),
    ('23X41A4427', 'Jelli Kranthi Swarupa'),
    ('23X41A4428', 'Jujjavarapu Iswarya'),
    ('23X41A4429', 'Karlakunta Subba Rao'),
    ('23X41A4430', 'Karri Naga Mahith Kumar'),
    ('23X41A4432', 'Kodhati Sri Lalitha'),
    ('23X41A4433', 'K. Harshitha Chowdary'),
    ('23X41A4434', 'Kothapalli Komali'),
    ('23X41A4435', 'M. L. Venkata Sai Lakshmi'),
    ('23X41A4437', 'Md Shaziya Tarannum'),
    ('23X41A4438', 'Miriyala Bala Swaritha'),
    ('23X41A4439', 'Mohammed Mustafa'),
    ('23X41A4441', 'M Bayazeed Babu'),
    ('23X41A4442', 'Nandyala Iswarya'),
    ('23X41A4444', 'Rajavarapu Nandini Devi'),
    ('23X41A4445', 'R. Chaitanya Lakshmi'),
    ('23X41A4446', 'Sambangi Poornima'),
    ('23X41A4447', 'Sambravu Abhiram'),
    ('23X41A4448', 'Seelam Sneha'),
    ('23X41A4450', 'Shaik Nowshiya'),
    ('23X41A4451', 'Shaik Saleem'),
    ('23X41A4452', 'Shaik Zakeer Hussain'),
    ('23X41A4453', 'Srinancharaiah Naidu G'),
    ('23X41A4454', 'Sunkara Venkata Renu Gopal'),
    ('23X41A4455', 'Surapaneni Aasritha'),
    ('23X41A4456', 'Suriboina Venkata Mokshagna'),
    ('23X41A4457', 'Syed Sahil Samad'),
    ('23X41A4459', 'T. Jahanavi'),
    ('23X41A4460', 'Tatikayala Maharshi'),
    ('23X41A4461', 'Thota Leela Vardhan'),
    ('23X41A4462', 'Tiruvayepati Harshi'),
    ('23X41A4464', 'Vemuri Gopi'),
    ('23X41A4465', 'Vinukonda Haseena'),
    ('23X41A4466', 'Yarroju Susritha'),
    ('24X45A4401', 'Basireddy Aswini'),
    ('24X45A4402', 'Damerla Sai Geethika'),
    ('24X45A4403', 'Kavuri Rakesh'),
    ('24X45A4404', 'Kota Sridhar'),
    ('24X45A4406', 'Nunna Venkata Sai Manikanta'),
],
    (4, 'B'): [
    ('23X41A4401', 'Aadirala Shirisha'),
    ('23X41A4402', 'Ariveni Hema Sri'),
    ('23X41A4403', 'Arja Jyothi Sri'),
    ('23X41A4404', 'A. Varshitha Lakshmi Durga'),
    ('23X41A4405', 'Bachhala Venkata Sri Krishna'),
    ('23X41A4406', 'Baddapu Sai Krishna'),
    ('23X41A4407', 'Banavathu Rishi Naik'),
    ('23X41A4409', 'Betala Kinnera'),
    ('23X41A4410', 'Bezawada Anusha'),
    ('23X41A4411', 'Bezawada Jahnavi'),
    ('23X41A4412', 'Challa Gayathri Sukanya'),
    ('23X41A4414', 'Chandu Venkata Navya'),
    ('23X41A4416', 'Devarla Ramya Sri'),
    ('23X41A4417', 'Done Meghanadh'),
    ('23X41A4419', 'Duvvada Yashwanth Damodar'),
    ('23X41A4420', 'Duvvapu Madhavi'),
    ('23X41A4421', 'Ganta Pavan'),
    ('23X41A4422', 'Goriparti Naga Prasanna'),
    ('23X41A4423', 'Guggilla Naga Ambika'),
    ('23X41A4424', 'Guntaka Bhavya Spurthi'),
    ('23X41A4425', 'Gurram Sandeep'),
    ('23X41A4426', 'Jangam Mithil'),
    ('23X41A4427', 'Jelli Kranthi Swarupa'),
    ('23X41A4428', 'Jujjavarapu Iswarya'),
    ('23X41A4429', 'Karlakunta Subba Rao'),
    ('23X41A4430', 'Karri Naga Mahith Kumar'),
    ('23X41A4432', 'Kodhati Sri Lalitha'),
    ('23X41A4433', 'K. Harshitha Chowdary'),
    ('23X41A4434', 'Kothapalli Komali'),
    ('23X41A4435', 'M. L. Venkata Sai Lakshmi'),
    ('23X41A4437', 'Md Shaziya Tarannum'),
    ('23X41A4438', 'Miriyala Bala Swaritha'),
    ('23X41A4439', 'Mohammed Mustafa'),
    ('23X41A4441', 'M Bayazeed Babu'),
    ('23X41A4442', 'Nandyala Iswarya'),
    ('23X41A4444', 'Rajavarapu Nandini Devi'),
    ('23X41A4445', 'R. Chaitanya Lakshmi'),
    ('23X41A4446', 'Sambangi Poornima'),
    ('23X41A4447', 'Sambravu Abhiram'),
    ('23X41A4448', 'Seelam Sneha'),
    ('23X41A4450', 'Shaik Nowshiya'),
    ('23X41A4451', 'Shaik Saleem'),
    ('23X41A4452', 'Shaik Zakeer Hussain'),
    ('23X41A4453', 'Srinancharaiah Naidu G'),
    ('23X41A4454', 'Sunkara Venkata Renu Gopal'),
    ('23X41A4455', 'Surapaneni Aasritha'),
    ('23X41A4456', 'Suriboina Venkata Mokshagna'),
    ('23X41A4457', 'Syed Sahil Samad'),
    ('23X41A4459', 'T. Jahanavi'),
    ('23X41A4460', 'Tatikayala Maharshi'),
    ('23X41A4461', 'Thota Leela Vardhan'),
    ('23X41A4462', 'Tiruvayepati Harshi'),
    ('23X41A4464', 'Vemuri Gopi'),
    ('23X41A4465', 'Vinukonda Haseena'),
    ('23X41A4466', 'Yarroju Susritha'),
    ('24X45A4401', 'Basireddy Aswini'),
    ('24X45A4402', 'Damerla Sai Geethika'),
    ('24X45A4403', 'Kavuri Rakesh'),
    ('24X45A4404', 'Kota Sridhar'),
    ('24X45A4406', 'Nunna Venkata Sai Manikanta'),
],
}

# Timetable source: AY 2026-27, Semester I, supplied department timetables.
# A/B use their own timetable; 4th year timetable is supplied for Class IV Section A
# and is applied to both A and B as requested by the project owner.
TIME_SLOTS = [
    {'period':1,'start':'09:00','end':'09:50','label':'9:00 AM – 9:50 AM'},
    {'period':2,'start':'09:50','end':'10:40','label':'9:50 AM – 10:40 AM'},
    {'period':3,'start':'10:45','end':'11:35','label':'10:45 AM – 11:35 AM'},
    {'period':4,'start':'11:35','end':'12:25','label':'11:35 AM – 12:25 PM'},
    {'period':5,'start':'13:10','end':'14:00','label':'1:10 PM – 2:00 PM'},
    {'period':6,'start':'14:00','end':'14:45','label':'2:00 PM – 2:45 PM'},
    {'period':7,'start':'14:50','end':'15:35','label':'2:50 PM – 3:35 PM'},
    {'period':8,'start':'15:35','end':'16:20','label':'3:35 PM – 4:20 PM'},
]

SUBJECTS = {
  2: {
    'DMGT': ('Discrete Mathematics & Graph Theory','DR. R.L. MOUNIKA'),
    'UHV': ('Universal Human Values','CH.L N PRATHYUSHA'),
    'IDS': ('Introduction to Data Science','CH.SAI SIVA DURGA'),
    'ADS': ('Advanced Data Structures','DR.CM.SUVANA VARMA'),
    'JAVA': ('Object Oriented Through Java (OOP Java)','DR.V. SREENIVAS'),
    'IDS LAB': ('Data Science Lab','CH.SAI SIVA DURGA'),
    'JAVA LAB': ('Object Oriented Through Java Lab','D.SAI VENKATA GOWTHAM'),
    'PYTHON LAB': ('Python Programming Lab','V.JAYA SRI'),
    'ES': ('Environmental Studies','V.RAM BABU'),
    'ASSOC': ('Association','M.BHAGYA SRI'),
    'LIB': ('Sports & Library','D.SAI VENKATA GOWTHAM'),
    'SPORTS': ('Sports & Library','D.SAI VENKATA GOWTHAM'),
    'CERT COURSE': ('Certification Course','M.VINUTHNA'),
  },
  3: {
    'ML': ('Machine Learning','M.VINUTHNA'),
    'CN': ('Computer Networks','D.SAI VENKATA GOWTHAM'),
    'SE': ('Software Engineering','V.NAGA MEENA'),
    'CTM': ('Construction Technology & Management','B.SAI KUMAR REDDY'),
    'OOAD': ('Object Oriented Analysis & Design','M. BHAGYA SRI'),
    'ML LAB': ('Machine Learning Lab','M.VINUTHNA'),
    'CN LAB': ('Computer Networks Lab','D.S.V GOWTHAM'),
    'FULL STACK LAB': ('Full Stack Development Lab','M. BHAGYA SRI'),
    'TINKERING LAB': ('Tinkering Lab','V.JAYA SRI'),
    'SOFT SKILLS': ('Softskills','G.PRAVEEN'),
    'LIB': ('Library','N.NAGA MANI'),
    'ASSOC': ('Association','CH.SAI SIVA DURGA'),
    'SPORTS': ('Sports','B.M.RAJA SEKHAR'),
    'CERT COURSE': ('Certification Course','M. BHAGYA SRI'),
  },
  4: {
    'BCT': ('Block Chain Technology','DR.C.M. SUVARNA VARMA'),
    'COI': ('Constitution of India','B. RANGA NAGA VALLI'),
    'BDA': ('Big Data Analytics','V. JAYA SRI'),
    'SWM': ('Solid Waste Management','A. KRISHNA PRIYA'),
    'SGT': ('Smart Grid Technology','S.SANDHYA'),
    'HRM': ('Human Resource & Project Management','G. SRI LALITHA'),
    'COUNSEL LNG': ('Counselling',''),
    'NPTEL': ('NPTEL','B.M. RAJA SEKHAR'),
    'FULL STACK LAB-II': ('Full Stack Lab-II','M .BHAGYA SRI'),
    'LIB': ('Library',''),
    'MINI PROJECT': ('Mini Project',''),
  }
}

# Each day is a list of attendance sessions. Lab blocks are one session even though
# they occupy multiple timetable periods.
TT = {
  2: {
    'A': {
      'MON': [('IDS',1),('ADS',2),('JAVA',3),('JAVA',4),('PYTHON LAB',5,6,7,8)],
      'TUE': [('DMGT',1),('ADS',2),('DMGT',3),('CERT COURSE',4),('ES',5),('UHV',6),('DMGT',7),('CERT COURSE',8)],
      'WED': [('IDS LAB',1,2,3,4),('DMGT',5),('UHV',6),('JAVA',7),('JAVA',8)],
      'THU': [('IDS',1),('DMGT',2),('UHV',3),('ADS',4),('IDS',5),('JAVA',6),('ASSOC',7),('LIB',8)],
      'FRI': [('UHV',1),('ADS',2),('DMGT',3),('CERT COURSE',4),('JAVA LAB',5,6,7,8)],
      'SAT': [('ADS',1),('ES',2),('IDS',3),('JAVA',4),('ASSOC',5),('UHV',6),('ADS',7),('SPORTS',8)]
    },
    'B': {
      'MON': [('JAVA LAB',1,2,3,4),('IDS',5),('DMGT',6),('DMGT',7),('CERT COURSE',8)],
      'TUE': [('ADS',1),('IDS',2),('JAVA',3),('JAVA',4),('UHV',5),('DMGT',6),('ES',7),('ASSOC',8)],
      'WED': [('DMGT',1),('ADS',2),('JAVA',3),('IDS',4),('PYTHON LAB',5,6,7,8)],
      'THU': [('ADS',1),('UHV',2),('DMGT',3),('IDS',4),('UHV',5),('ASSOC',6),('JAVA',7),('JAVA',8)],
      'FRI': [('IDS LAB',1,2,3,4),('UHV',5),('CERT COURSE',6),('ADS',7),('LIB',8)],
      'SAT': [('DMGT',1),('ADS',2),('UHV',3),('ADS',4),('IDS',5),('ES',6),('JAVA',7),('SPORTS',8)]
    }
  },
  3: {
    'A': {
      'MON': [('CTM',1),('SE',2),('CN',3),('OOAD',4),('FULL STACK LAB',5,6,7,8)],
      'TUE': [('TINKERING LAB',1,2),('OOAD',3),('CN',4),('CTM',5),('ASSOC',6),('ML',7),('CERT COURSE',8)],
      'WED': [('ML',1),('CTM',2),('SE',3),('CERT COURSE',4),('CN',5),('OOAD',6),('ML',7),('LIB',8)],
      'THU': [('SE',1),('ML',2),('OOAD',3),('CTM',4),('ML LAB',5,6,7,8)],
      'FRI': [('CN',1),('CTM',2),('ML',3),('OOAD',4),('SOFT SKILLS',5),('SE',6),('SPORTS',7),('SPORTS',8)],
      'SAT': [('CN LAB',1,2,3,4),('CERT COURSE',5),('OOAD',6),('CN',7),('ASSOC',8)]
    },
    'B': {
      'MON': [('CN',1),('OOAD',2),('SE',3),('CTM',4),('SOFT SKILLS',5),('ML',6),('CERT COURSE',7),('CERT COURSE',8)],
      'TUE': [('CTM',1),('CN',2),('SE',3),('ML',4),('FULL STACK LAB',5,6,7,8)],
      'WED': [('SE',1),('CN',2),('CTM',3),('OOAD',4),('ML',5),('ASSOC',6),('TINKERING LAB',7,8)],
      'THU': [('CN LAB',1,2,3,4),('OOAD',5),('CN',6),('SE',7),('LIB',8)],
      'FRI': [('ML',1),('OOAD',2),('CN',3),('CTM',4),('CERT COURSE',5),('SE',6),('ML',7),('SPORTS',8)],
      'SAT': [('OOAD',1),('ASSOC',2),('CTM',3),('CERT COURSE',4),('ML LAB',5,6,7,8)]
    }
  },
  4: {
    'A': {
      'MON': [('BCT',1),('COI',2),('BDA',3),('SWM',4),('SGT',5),('HRM',6),('COUNSEL LNG',7),('NPTEL',8)],
      'TUE': [('SGT',1),('HRM',2),('BCT',3),('NPTEL',4),('SWM',5),('BDA',6),('COI',7),('NPTEL',8)],
      'WED': [('SWM',1),('HRM',2),('HRM',3),('BCT',4),('SWM',5),('SGT',6),('BDA',7),('COI',8)],
      'THU': [('FULL STACK LAB-II',1,2,3,4),('HRM',5),('BDA',6),('SGT',7),('BDA',8)],
      'FRI': [('BCT',1),('NPTEL',2),('SWM',3),('BCT',4),('SGT',5),('NPTEL',6),('LIB',7),('NPTEL',8)],
      'SAT': [('MINI PROJECT',1,2,3,4)]
    }
  }
}
TT[4]['B'] = TT[4]['A']

DAYS = ['MON','TUE','WED','THU','FRI','SAT']
DAY_NAMES = {'MON':'Monday','TUE':'Tuesday','WED':'Wednesday','THU':'Thursday','FRI':'Friday','SAT':'Saturday','SUN':'Sunday'}

def db():
    c=sqlite3.connect(DB); c.row_factory=sqlite3.Row; c.execute('PRAGMA foreign_keys=ON'); return c

def init_db():
    c=db()
    c.executescript('''
    CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, display_name TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS students(id INTEGER PRIMARY KEY, roll_no TEXT NOT NULL, name TEXT NOT NULL, phone TEXT, phone_status TEXT NOT NULL DEFAULT 'verified', year INTEGER NOT NULL CHECK(year BETWEEN 1 AND 4), section TEXT NOT NULL CHECK(section IN ('A','B')), UNIQUE(roll_no,year,section));
    CREATE INDEX IF NOT EXISTS idx_students_year_section ON students(year,section);
    CREATE TABLE IF NOT EXISTS attendance(id INTEGER PRIMARY KEY, student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE, attendance_date TEXT NOT NULL, present INTEGER NOT NULL CHECK(present IN (0,1)), UNIQUE(student_id,attendance_date));
    CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);
    CREATE TABLE IF NOT EXISTS attendance_sessions(
      id INTEGER PRIMARY KEY, attendance_date TEXT NOT NULL, year INTEGER NOT NULL, section TEXT NOT NULL,
      day_code TEXT NOT NULL, session_key TEXT NOT NULL UNIQUE, subject_code TEXT NOT NULL, subject_name TEXT NOT NULL,
      faculty_name TEXT NOT NULL, start_time TEXT NOT NULL, end_time TEXT NOT NULL, periods TEXT NOT NULL,
      submitted_at TEXT NOT NULL, submitted_by TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS attendance_records(
      id INTEGER PRIMARY KEY, session_id INTEGER NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE, status TEXT NOT NULL CHECK(status IN ('present','absent','late','leave')),
      UNIQUE(session_id,student_id)
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_date ON attendance_sessions(attendance_date,year,section);
    CREATE INDEX IF NOT EXISTS idx_records_session ON attendance_records(session_id);
    ''')
    # Keep compatibility with databases created by the earlier portal version.
    for col, ddl in [('phone','TEXT'),('phone_status',"TEXT NOT NULL DEFAULT 'verified'")]:
        try: c.execute(f'ALTER TABLE students ADD COLUMN {col} {ddl}')
        except sqlite3.OperationalError: pass
    pw=hashlib.sha256('Admin123@321'.encode()).hexdigest()
    c.execute('INSERT OR IGNORE INTO users(username,password_hash,display_name) VALUES(?,?,?)',('DATA SCIENCE',pw,'Data Science Faculty'))
    # Keep the small Year-1 demo list, and load the supplied Years 2-4 lists.
    for year in (1,):
        for section in ('A','B'):
            for roll,name in SEED_STUDENTS:
                c.execute('INSERT OR IGNORE INTO students(roll_no,name,year,section) VALUES(?,?,?,?)',(roll,name,year,section))
    for (year, section), roster in STUDENT_DATA.items():
        for roll, name in roster:
            c.execute(
                'INSERT OR IGNORE INTO students(roll_no,name,year,section) VALUES(?,?,?,?)',
                (roll, name, year, section)
            )
    c.commit(); c.close()

def get_timetable(year, section, day=None):
    if year not in TT or section not in TT[year]: return []
    slots_master = TIME_SLOTS
    if year == 3:
        slots_master = [dict(x) for x in TIME_SLOTS]
        slots_master[3]['end'] = '12:35'; slots_master[3]['label'] = '11:35 AM – 12:35 PM'
    days = [day] if day else DAYS
    out=[]
    for d in days:
        for idx,item in enumerate(TT[year][section].get(d,[])):
            code=item[0]; periods=list(item[1:])
            # Handle repeated MINI PROJECT entries by treating each as its own 4-period block.
            slots=[slots_master[p-1] for p in periods]
            start=slots[0]['start']; end=slots[-1]['end']
            subj, faculty = SUBJECTS.get(year,{}).get(code,(code,''))
            out.append({'day':d,'day_name':DAY_NAMES[d],'subject_code':code,'subject_name':subj,'faculty_name':faculty,
                        'periods':periods,'period_label':' + '.join('P'+str(p) for p in periods),
                        'start_time':start,'end_time':end,'time_label':f"{start} – {end}",
                        'slot_index':idx,'session_key_base':f"{year}-{section}-{d}-{idx}"})
    return out

def today_code(now=None):
    now = now or india_now()
    return ['MON','TUE','WED','THU','FRI','SAT','SUN'][now.weekday()]

def today_sessions(year, section, now=None):
    now = now or india_now()
    day = today_code(now)
    if day == 'SUN':
        return []
    return get_timetable(year, section, day)

def current_session(year, section, now=None):
    now = now or india_now()
    hm = now.strftime('%H:%M')
    for x in today_sessions(year, section, now):
        if x['start_time'] <= hm < x['end_time']:
            return x
    return None

def college_window(year, section, now=None):
    sessions = today_sessions(year, section, now)
    if not sessions:
        return None, None
    return min(x['start_time'] for x in sessions), max(x['end_time'] for x in sessions)

def attendance_day_open(year, section, now=None):
    now = now or india_now()
    opens, closes = college_window(year, section, now)
    if not opens or not closes:
        return False, 'No classes are scheduled today.'
    hm = now.strftime('%H:%M')
    if hm < opens:
        return False, f'Attendance opens at {opens} IST.'
    if hm >= closes:
        return False, f'College attendance is locked after {closes} IST.'
    return True, ''

class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs): super().__init__(*args,directory=ROOT,**kwargs)
    def send_json(self,obj,status=200):
        raw=json.dumps(obj).encode(); self.send_response(status); self.send_header('Content-Type','application/json'); self.send_header('Cache-Control','no-store'); self.send_header('Content-Length',str(len(raw))); self.end_headers(); self.wfile.write(raw)
    def body(self):
        try:
            n=int(self.headers.get('Content-Length','0')); return json.loads(self.rfile.read(n) or b'{}')
        except Exception: return {}
    def do_POST(self):
        p=urlparse(self.path); x=self.body()
        if p.path=='/api/login':
            c=db(); u=c.execute('SELECT * FROM users WHERE username=?',(str(x.get('username','')).strip(),)).fetchone(); c.close()
            ok=bool(u and hmac.compare_digest(u['password_hash'],hashlib.sha256(str(x.get('password','')).encode()).hexdigest()))
            return self.send_json({'ok':ok,'display_name':u['display_name'] if ok else None},200 if ok else 401)
        if p.path=='/api/attendance':
            try:
                year=int(x.get('year',0))
            except Exception:
                year=0
            section=str(x.get('section','')).strip().upper()
            records=x.get('records',[])
            submitted_by=str(x.get('submitted_by','DATA SCIENCE')).strip() or 'DATA SCIENCE'
            if year not in range(2,5) or section not in ('A','B'):
                return self.send_json({'error':'Attendance is enabled for Years 2–4.'},400)
            now=india_now(); today=now.strftime('%Y-%m-%d')
            ok,reason=attendance_day_open(year,section,now)
            if not ok:
                return self.send_json({'error':reason},409)
            session_key=str(x.get('session_key','')).strip()
            session=None
            for item in today_sessions(year,section,now):
                key=f"{today}|{year}|{section}|{item['day']}|{item['slot_index']}"
                if key==session_key:
                    session=item
                    break
            if not session:
                session=current_session(year,section,now)
                if session:
                    session_key=f"{today}|{year}|{section}|{session['day']}|{session['slot_index']}"
            if not session:
                return self.send_json({'error':'Select a valid period from today’s timetable.'},400)
            c=db()
            try:
                exists=c.execute('SELECT id FROM attendance_sessions WHERE session_key=?',(session_key,)).fetchone()
                if exists:
                    return self.send_json({'error':f"Attendance for {session['subject_name']} is already submitted for this session."},409)
                                          cur = c.execute('''INSERT INTO attendance_sessions(attendance_date,year,section,day_code,session_key,subject_code,subject_name,faculty_name,start_time,end_time,periods,submitted_at,submitted_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)''',
                    (today,year,section,session['day'],key,session['subject_code'],session['subject_name'],session['faculty_name'],session['start_time'],session['end_time'],','.join(map(str,session['periods'])),now.isoformat(timespec='seconds'),submitted_by))
                sid = cur.lastrowid
                saved = 0
                for r in records:
                    st = c.execute('SELECT id FROM students WHERE roll_no=? AND year=? AND section=?',(str(r.get('roll_no','')).strip(),year,section)).fetchone()
                    if not st:
                        continue
                    status = str(r.get('status','present' if r.get('present') else 'absent')).lower()
                    if status not in ('present','absent','late','leave'):
                        status = 'absent'
                    c.execute('INSERT INTO attendance_records(session_id,student_id,status) VALUES(?,?,?)',(sid,st['id'],status))
                    saved += 1
                c.commit()
                return self.send_json({'ok':True,'session_id':sid,'session_key':session_key,'subject_name':session['subject_name'],'faculty_name':session['faculty_name'],'saved':saved,'submitted_at':now.isoformat(timespec='seconds')})
            except sqlite3.IntegrityError:
                c.rollback()
                return self.send_json({'error':'This attendance session has already been submitted.'},409)
            except Exception as e:
                c.rollback()
                return self.send_json({'error':f'Attendance save failed: {e}'},500)
            finally:
                c.close()
        return self.send_json({'error':'Not found'},404)
    def do_GET(self):
        p=urlparse(self.path); q=parse_qs(p.query)
        if not p.path.startswith('/api/'): return super().do_GET()
        c=db()
        try:
            if p.path=='/api/students':
                year=int(q.get('year',['1'])[0]); section=q.get('section',['A'])[0]
                if year == 0 and section == 'ALL': rows=c.execute('SELECT roll_no,name,phone,phone_status,year,section FROM students ORDER BY year,section,roll_no').fetchall()
                elif year == 0: rows=c.execute('SELECT roll_no,name,phone,phone_status,year,section FROM students WHERE section=? ORDER BY year,roll_no',(section,)).fetchall()
                elif section == 'ALL': rows=c.execute('SELECT roll_no,name,phone,phone_status,year,section FROM students WHERE year=? ORDER BY section,roll_no',(year,)).fetchall()
                else: rows=c.execute('SELECT roll_no,name,phone,phone_status,year,section FROM students WHERE year=? AND section=? ORDER BY roll_no',(year,section)).fetchall()
                return self.send_json([dict(r) for r in rows])
            if p.path=='/api/timetable':
                year=int(q.get('year',['2'])[0]); section=q.get('section',['A'])[0]; day=q.get('day',[None])[0]
                return self.send_json({'year':year,'section':section,'holiday':'Sunday','slots':get_timetable(year,section,day)})
            if p.path=='/api/today-sessions':
                year=int(q.get('year',['2'])[0]); section=q.get('section',['A'])[0].upper()
                now=india_now(); today=now.strftime('%Y-%m-%d'); day=today_code(now); hm=now.strftime('%H:%M')
                opens,closes=college_window(year,section,now)
                window_open,_=attendance_day_open(year,section,now)
                result=[]
                for s in today_sessions(year,section,now):
                    key=f"{today}|{year}|{section}|{s['day']}|{s['slot_index']}"
                    done=c.execute('SELECT id,submitted_at,submitted_by FROM attendance_sessions WHERE session_key=?',(key,)).fetchone()
                    result.append(dict(s,session_key=key,session_id=done['id'] if done else None,already_submitted=bool(done),submitted=dict(done) if done else None,is_current=s['start_time']<=hm<s['end_time'],can_submit=bool(window_open and not done)))
                return self.send_json({'date':today,'day':day,'day_name':DAY_NAMES[day],'india_time':now.strftime('%H:%M:%S'),'college_open':opens,'college_close':closes,'attendance_window_open':window_open,'sessions':result})
            if p.path=='/api/current-session':
                year=int(q.get('year',['0'])[0]); section=q.get('section',['A'])[0].upper()
                now=india_now()
                s=current_session(year,section,now)
                if not s:
                    day=today_code(now)
                    opens,closes=college_window(year,section,now)
                    window_open,_=attendance_day_open(year,section,now)
                    return self.send_json({'open':False,'attendance_window_open':window_open,'holiday':day=='SUN','day':day,'day_name':DAY_NAMES[day],'college_open':opens,'college_close':closes})
                today=now.strftime('%Y-%m-%d'); key=f"{today}|{year}|{section}|{s['day']}|{s['slot_index']}"
                done=c.execute('SELECT id,submitted_at,submitted_by FROM attendance_sessions WHERE session_key=?',(key,)).fetchone()
                opens,closes=college_window(year,section,now)
                window_open,_=attendance_day_open(year,section,now)
                return self.send_json({'open':bool(window_open and not done),'attendance_window_open':window_open,'already_submitted':bool(done),'session':dict(s, session_id=(done['id'] if done else None), session_key=key, session_date=today),'submitted':dict(done) if done else None,'college_open':opens,'college_close':closes})
            if p.path=='/api/attendance':
                year=int(q.get('year',['1'])[0]); section=q.get('section',['A'])[0]; dt=q.get('date',[''])[0]
                session_id=q.get('session_id',[None])[0]
                if year >= 2 and session_id:
                    rows=c.execute('''SELECT s.roll_no,s.name,COALESCE(ar.status,'absent') status FROM students s LEFT JOIN attendance_records ar ON ar.student_id=s.id AND ar.session_id=? WHERE s.year=? AND s.section=? ORDER BY s.roll_no''',(int(session_id),year,section)).fetchall()
                elif year >= 2:
                    rows=c.execute('''SELECT s.roll_no,s.name,'absent' status FROM students s WHERE s.year=? AND s.section=? ORDER BY s.roll_no''',(year,section)).fetchall()
                else:
                    rows=c.execute('''SELECT s.roll_no,s.name,CASE WHEN a.present=1 THEN 'present' ELSE 'absent' END status FROM students s LEFT JOIN attendance a ON a.student_id=s.id AND a.attendance_date=? WHERE s.year=? AND s.section=? ORDER BY s.roll_no''',(dt,year,section)).fetchall()
                return self.send_json([dict(r) for r in rows])
            if p.path=='/api/history':
                rows=c.execute('''SELECT id,attendance_date date,year,section,subject_name,faculty_name,start_time,end_time,periods,submitted_at,submitted_by,(SELECT COUNT(*) FROM attendance_records ar WHERE ar.session_id=ass.id) total,(SELECT COUNT(*) FROM attendance_records ar WHERE ar.session_id=ass.id AND ar.status='present') present FROM attendance_sessions ass ORDER BY attendance_date DESC,submitted_at DESC LIMIT 100''').fetchall()
                return self.send_json([dict(r) for r in rows])
            if p.path=='/api/report':
                year=int(q.get('year',['1'])[0]); section=q.get('section',['A'])[0]
                if year >= 2:
                    rows=c.execute('''SELECT s.roll_no,s.name,COUNT(ar.id) sessions,SUM(CASE WHEN ar.status='present' THEN 1 ELSE 0 END) present,SUM(CASE WHEN ar.status='absent' THEN 1 ELSE 0 END) absent,CASE WHEN COUNT(ar.id)=0 THEN 0 ELSE ROUND(100.0*SUM(CASE WHEN ar.status='present' THEN 1 ELSE 0 END)/COUNT(ar.id),2) END percentage FROM students s LEFT JOIN attendance_records ar ON ar.student_id=s.id LEFT JOIN attendance_sessions ass ON ass.id=ar.session_id WHERE s.year=? AND s.section=? AND (ar.id IS NULL OR (ass.year=? AND ass.section=?)) GROUP BY s.id ORDER BY s.roll_no''',(year,section,year,section)).fetchall()
                else:
                    rows=c.execute('''SELECT s.roll_no,s.name,COUNT(a.id) sessions,COALESCE(SUM(a.present),0) present,COALESCE(COUNT(a.id)-SUM(a.present),0) absent,CASE WHEN COUNT(a.id)=0 THEN 0 ELSE ROUND(100.0*SUM(a.present)/COUNT(a.id),2) END percentage FROM students s LEFT JOIN attendance a ON a.student_id=s.id WHERE s.year=? AND s.section=? GROUP BY s.id ORDER BY s.roll_no''',(year,section)).fetchall()
                return self.send_json([dict(r) for r in rows])
            if p.path=='/api/dashboard':
                out=[]
                for y in range(1,5):
                    for sec in ('A','B'):
                        if y>=2:
                            r=c.execute('''SELECT COUNT(ar.id) sessions,SUM(CASE WHEN ar.status='present' THEN 1 ELSE 0 END) present FROM attendance_records ar JOIN attendance_sessions ass ON ass.id=ar.session_id JOIN students s ON s.id=ar.student_id WHERE ass.year=? AND ass.section=?''',(y,sec)).fetchone()
                        else:
                            r=c.execute('''SELECT COUNT(a.id) sessions,COALESCE(SUM(a.present),0) present FROM attendance a JOIN students s ON s.id=a.student_id WHERE s.year=? AND s.section=?''',(y,sec)).fetchone()
                        sessions=int(r['sessions'] or 0); present=int(r['present'] or 0)
                        out.append({'year':y,'section':sec,'sessions':sessions,'present':present,'percentage':round(100*present/sessions) if sessions else 0})
                return self.send_json(out)
            return self.send_json({'error':'Not found'},404)
        except Exception as e:
            return self.send_json({'error':f'Server error: {e}'},500)
        finally:
            c.close()

if __name__=='__main__':
    init_db()
    port = int(os.environ.get('PORT', 10000))
    print(f'CSD Attendance running on 0.0.0.0:{port}')
    ThreadingHTTPServer(('0.0.0.0', port), Handler).serve_forever()

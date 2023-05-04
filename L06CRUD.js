//Create Read Update Delete
//유저에게 db를 제어할 수 있는 인터페이스(모델,서비스)
//유저가 직접 DB에 접속해서 데이터를 조작하면 안되나요? 안된다.
//1.데이터 조작의 인터페이스를 제한할 수 없다.(보안)
//2.불필요한 정보가 많아서 유저가 어려워서 이용하지 않는다 (서비스)
//3.유저가 SQL 을 배워야한다. (어려움)
//create,alter,drop: table 을 생성하거나 구조를 바꾸거나 삭제하는 명령어(DDL)
//update,delete,insert(DML),select(DQL) : table 데이터를 추가하거나 삭제 또는 수정 조회 명령어
//es6 부터는 var 사용을 권장하지 않는다.(변수는 지역 전역 구분이 있어야 하는데 ..var 무조건 전역)

const http=require("http");
const url=require("url");
const querystring=require("querystring");
const fs=require("fs/promises");
const mysql2=require("mysql2");
const pug=require("pug");
//jvm or v8 이 실행이될 때 메모리에 등록하는것 :백그라운드
//java 에선 java.lang.*,java.util.* 패키지가 가지고 있는 라이브러리가 많은편
//nodejs 는 백그라운드에서 가지고 있는 모듈이 적은 편이라 빠르지만 모듈 등록이 귀찮다.

const server=http.createServer();
server.listen(8888,()=>{
    console.log("http://localhost:8888 SCOTT CRUD 서버");
})//서버를 듣겠다.
const mysqlConInfo={
    host:"localhost",
    port:3306,
    user:"root",
    password:"mysql123",
    database:"scott"
}

const creatPool=mysql2.createPool(mysqlConInfo);
const pool=creatPool.promise();



server.on("request",async (req, res)=>{
    res.setHeader("content-type","text/html;charset=UTF-8;") //서버에 요청이 들어오면 ~ 하겠다.
  const urlObj=url.parse(req.url); //요청에 따라서 리소스를 따라가도록 url 세팅
  const params=querystring.parse(urlObj.query);
  const urlSplits=urlObj.pathname.split("/");//첫번째가 public 이오면 동적,아니면 정적
  if(urlSplits[1]==="public"){//정적 리소스
    if(urlSplits[2]==="js"){
        res.setHeader("content-type","application/javascript");
    }else if(urlSplits[2]==="css"){
        res.setHeader("content-type","text/css");
    }else if(urlSplits[2]==="image"){
        res.setHeader("content-type","image/jpeg");
    }
    try {
        //fs : 서버가 실행되고 있는 컴퓨터를 기준으로 파일을 검색
        //상대경로를 "/" : 컴퓨터의 root 경로를 기준으로 파일을 검색
        //상대경로 ".or./" : 서버가 실행되고 있는 위치를 기준으로 파일을 검색
        let data=await fs.readFile("."+urlObj.pathname);
        res.write(data);
        res.end();
    }catch (e){//주소가 잘못되었을 때 (리소스 요청을 잘못한 것)
        res.statusCode=404;
        res.end();
    }
  }else {//동적 리소스
        if(urlObj.pathname==="/"){
            const html=pug.renderFile("./templates/index.pug");
            res.write(html);
            res.end();
        }else if(urlObj.pathname==="/empList.do"){
            try {
                const [rows,fields]=await  pool.query("SELECT * FROM EMP");
                let html=pug.renderFile("./templates/empList.pug",{empList:rows})
                res.write(html);
                res.end();
            }catch (e) {
                console.error(e)
            }

        }else if(urlObj.pathname==="/empDetail.do"){
            let empno=Number(params.empno);
            //만약 empno 가 없다
            //400 에러 : 요청할 떄 꼭 필요한 파라미터를 보내지 않았다.
            if(Number.isNaN(empno)) {
                res.statusCode=400;
                res.write("<h1>해당 페이지에 꼭 필요한 파라미터를 보내지 않았습니다. 400</h1>");
                res.end();
                return;//응답이 완료되어도 밑에 코드가 실행될 수도 있어서 가장 인접한 콜백함수를 종료함
            }
            let sql="SELECT * FROM EMP WHERE EMPNO=?"; //? 에다 파라미터를 대입 : preparedStatement
            const [rows,f]= await pool.query(sql,[empno]);
            const html=pug.renderFile("./templates/empDetail.pug",{emp:rows[0]})
            //무조건 SELECT 의 결과는 배열이다.
            res.write(html);
            res.end();

        }else if(urlObj.pathname==="/empUpdate.do"&&req.method==="GET"){
            let empno=Number(params.empno);
            //만약 empno 가 없다
            //400 에러 : 요청할 떄 꼭 필요한 파라미터를 보내지 않았다.
            if(Number.isNaN(empno)) {
                res.statusCode=400;
                res.write("<h1>해당 페이지에 꼭 필요한 파라미터를 보내지 않았습니다. 400</h1>");
                res.end();
                return;//응답이 완료되어도 밑에 코드가 실행될 수도 있어서 가장 인접한 콜백함수를 종료함
            }
            let sql="SELECT * FROM EMP WHERE EMPNO=?"; //? 에다 파라미터를 대입 : preparedStatement
            const [rows,f]= await pool.query(sql,[empno]);
            let html=pug.renderFile("./templates/empUpdate.pug",{emp:rows[0]})
            res.write(html);
            res.end();
        }else if(urlObj.pathname==="/empUpdate.do"&&req.method==="POST"){
            //data 를 수정하는 동적리소스 (액션페이지)
            //dml 을 실생할때는 오류가 종종 발생하기 떄문에 꼭 예외처리!
            //querystring 은 url 에 오는 파라미터만 객체로 파싱중.
            //POST 로 파라미터는 요청헤더의 본문을 해석해서 받아와야 한다.!!!!
            let postQuery="";
            let update=0; //0이면 실패 1이면 성공
            req.on("data",(param)=>{
                postQuery+=param;
            }); //요청헤더의 문서를 읽는 이벤트. ( post 로 넘긴 querystring 불러오기)
            req.on("end",async ()=>{
                // console.log(postQuery)
                const postPs=querystring.parse(postQuery);
                try {
                    let sql=`UPDATE EMP SET 
                        ENAME=?,SAL=?,COMM=?,JOB=?,MGR=?,DEPTNO=?,HIREDATE=? 
                        WHERE EMPNO=?`
                    const [result]=await pool.execute(sql,
                        [postPs.ename,
                                (!postPs.sal.trim())?null:Number(postPs.sal),
                                (!postPs.comm.trim())?null:Number(postPs.comm),
                                postPs.job,
                                (!postPs.mgr.trim())?null:Number(postPs.mgr),
                                (!postPs.deptno.trim())?null:Number(postPs.deptno),
                                postPs.hiredate,
                                Number(postPs.empno)
                        ]) //DML
                    // console.log(result);
                    update=result.affectedRows;
                }catch (e){
                    console.error(e);
                }
                //오류없이 잘 실행되고 update 도 잘 되면  update=1
                if(update>0){
                    //302 : redirect 이페이지가 응답하지 않고 다른 페이지가 응답 하도록 서버 내부에서 요청하는것.
                    res.writeHead(302,{location:"/empDetail.do?empno="+postPs.empno})
                    res.end();
                }else{
                    res.writeHead(302,{location:"/empUpdate.do?empno="+postPs.empno})
                    res.end();
                }

            })//요청헤더의 문서를 모두 다 읽으면 발생하는 이벤트.

        }else if(urlObj.pathname==="/empInsert.do"&& req.method==="GET"){//등록 form
               let html= pug.renderFile("./templates/empInsert.pug")
                res.write(html);
               res.end();
        }else if(urlObj.pathname==="/empInsert.do"&& req.method==="POST"){//등록 action        😍😍post 데이터 받는법
            let postQuery="";
                req.on("data",(p)=>{postQuery+=p});
                req.on("end",async ()=>{
                    const postPs=querystring.parse(postQuery);
                    for(let key in postPs){
                        if(postPs[key].trim()==="")postPs[key]=null;
                    }
                    let sql=`INSERT INTO EMP (EMPNO, ENAME, JOB, MGR, HIREDATE, SAL, COMM, DEPTNO) VALUE (?,?,?,?,?,?,?,?)`;
                    let insert=0;
                    try {
                      const [result]=  await pool.execute(sql,
                          [postPs.empno,
                                   postPs.ename,
                                   postPs.job,
                                   postPs.mgr,
                                   postPs.hiredate,
                                   postPs.sal,
                                   postPs.comm,
                                   postPs.deptno
                          ]);
                      insert=result.affectedRows;
                    }catch (e){
                        console.error(e);
                    }
                    if(insert>0){
                        //302 : redirect 이페이지가 응답하지 않고 다른 페이지가 응답 하도록 서버 내부에서 요청하는것.
                        res.writeHead(302,{location:"/empList.do"})
                        res.end();
                    }else{
                        res.writeHead(302,{location:"/empInsert.do"})
                        res.end();
                    }
                })
        }else if(urlObj.pathname==="/empDelete.do"){//삭제 액션 페이지
            let empno=Number(params.empno);
            let sql="DELETE FROM EMP WHERE EMPNO=?";
            let del=0;  //delete 는 필드를 삭제하는 연산자 예약어

            try {
                const [result]=await pool.execute(sql,[empno]);
                del=result.affectedRows;
            }catch (e){
                console.error(e);
            }
            if(del>0){
                res.writeHead(302,{location:"/empList.do"});
                res.end();
            }else {

                res.writeHead(302,{location:"/empUpdate.do?empno=?"+params.empno});
                res.end();
            }
        }else if(urlObj.pathname==="/deptList.do"){
            try {
                const [rows,f]= await pool.query("SELECT * FROM DEPT");

                let html=pug.renderFile("./templates/deptList.pug",{deptList:rows});
                res.write(html);
                res.end();
            }catch (e) {
                console.error(e)
            }
        }else if(urlObj.pathname==="/deptDetail.do"){
            let deptno=Number(params.deptno);

            if (Number.isNaN(deptno)){
                errMsg();
                return;
            }
            let sql="SELECT * FROM DEPT WHERE DEPTNO=?";
            const [rows,fields]=await pool.query(sql,[deptno]);
            const html=pug.renderFile("./templates/deptDetail.pug",{dept:rows[0]})
            res.write(html);
            res.end();
        }else if(urlObj.pathname==="/deptUpdate.do"&&req.method==="GET"){
            let deptno=Number(params.deptno);
            if (Number.isNaN(deptno)){
                errMsg();
                return;
            }
            let sql="SELECT * FROM DEPT WHERE DEPTNO=?";
            const [rows,fields]=await pool.query(sql,[deptno]);
            const html=pug.renderFile("./templates/deptUpdate.pug",{dept:rows[0]});
            res.write(html);
            res.end();
        }else if(urlObj.pathname==="/deptUpdate.do"&&req.method==="POST"){
            let postQuery="";
            let update=0;
            req.on("data",(p)=>{
                postQuery+=p;
            });
            req.on("end",async ()=>{
                const postPs=  querystring.parse(postQuery);
                try{
                    let sql=`UPDATE DEPT SET  DNAME=?,LOC=? WHERE DEPTNO=?`
                    const [result]=await pool.execute(sql,[postPs.dname,postPs.loc,postPs.deptno]);

                    update=result.affectedRows;
                }catch (e) {
                    console.error(e);
                }
                Success(update,"/deptDetail.do?deptno="+postPs.deptno,"/deptUpdate.do?deptno="+postPs.deptno)

            });
        }else if(urlObj.pathname==="/deptDelete.do"){
            let deptno=Number(params.deptno);

            let sql="DELETE FROM DEPT WHERE DEPTNO=?";
            let del=0;

            try {
                const [result]=await pool.execute(sql,[deptno]);

                del=result.affectedRows;
            }catch (e) {
                console.error(e)
            }
            Success(del,"/deptList.do","/deptUpdate.do?deptno="+params.deptno)

        }else if(urlObj.pathname==="/deptInsert.do"&&req.method==="GET"){
            const html=pug.renderFile("./templates/deptInsert.pug");
            res.write(html);
            res.end();
        }else if (urlObj.pathname==="/deptInsert.do"&&req.method==="POST"){
            let postQuery="";
            req.on("data",(p)=>{postQuery+=p});
            req.on("end",async ()=>{
                const postPs=querystring.parse(postQuery);
                for(let key in postPs){
                    if(postPs[key].trim()==="")postPs[key]=null;
                }
                let sql=`INSERT INTO DEPT(DEPTNO, DNAME, LOC) VALUE (?,?,?)`;

                let insert=0;
                try {
                    const [result]=await pool.execute(sql,[postPs.deptno,postPs.dname,postPs.loc]);
                    insert=result.affectedRows;
                }catch (e) {
                    console.error(e);
                }
                Success(insert,"/deptList.do","/deptInsert.do")
            })
        }else if(urlObj.pathname==="/empnoCheck.do"){
            //empno 가 동일한 사원이 있으면 true 없으면 false
            if(!params.empno|| isNaN(params.empno)){//null=>false,undefined,null=> false
                res.statusCode=400; // 이 동적페이지에 요청을 잘못했다.(꼭 필요한 파라미터가 없다.!)
                res.end();
                return;
            }
            let empno=parseInt(params.empno);
            const resObj={checkId:false,emp:null}; //Object 를 문자열로 응답 하는것을 JSON 이라 부른다.
            let sql=`SELECT * FROM emp WHERE EMPNO=?`;
            try {
                const [rows,fields]=await pool.query(sql,[empno]);
                if(rows.length>0){
                    resObj.checkId=true;
                    resObj.emp=rows[0];
                }
            }catch (e) {
                console.error(e);//오류가 발생하면 500
                res.statusCode=500;
                res.end();
                return;
            }
            res.setHeader("content-type","application/json;charset=utf-8;"); //응답하는 문서형식
            res.write(JSON.stringify(resObj));
            res.end();
        }
        else if(urlObj.pathname==="/deptCheck.do"){
            //dept 가 동일한 사원이 있으면 true 없으면 false
            if(!params.empno|| isNaN(params.empno)){//null=>false,undefined,null=> false
                res.statusCode=400; // 이 동적페이지에 요청을 잘못했다.(꼭 필요한 파라미터가 없다.!)
                res.end();
                return;
            }
            let empno=parseInt(params.empno);
            const resObj={checkId:false,dept:null}; //Object 를 문자열로 응답 하는것을 JSON 이라 부른다.
            let sql=`SELECT * FROM dept WHERE DEPTNO=?`;
            try {
                const [rows,fields]=await pool.query(sql,[empno]);
                if(rows.length>0){
                    resObj.checkId=true;
                    resObj.dept=rows[0];
                }
            }catch (e) {
                console.error(e);//오류가 발생하면 500
                res.statusCode=500;
                res.end();
                return;
            }
            res.setHeader("content-type","application/json;charset=utf-8;"); //응답하는 문서형식
            res.write(JSON.stringify(resObj));
            res.end();
        }
        else {//웹앱서버 -> 다른 웹앱서버는 사용법만 익히면 바로할 수 있는
                //웹앱서버 원리를 알면 다른공부는 재미있다.
                //node.js (원시웹앱서버 ~ 자동으로 하는 것이 없다.)
                res.statusCode=404;
                res.write("<h1>존재하지 않는 페이지 입니다. 404</h1>");
                res.end();
            }
        }
    function Success(sum,a,b){
        if(sum>0){
            res.writeHead(302,{location:a});
            res.end();
        }else{
            res.writeHead(302,{location:b});
            res.end();
        }
    }
    function errMsg(){
        res.statusCode=400;
        res.write("<h1>꼭필요한 파라미터를 보내지 않았습니다. 400오류</h1>");
        res.end();
    }

})

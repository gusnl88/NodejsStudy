const http = require("http");
//node js 에서 라이브러리(Module)를 임포트 하는 방법
//http : http 서버를 생성하고 클라이언트에 요청을 처리할 수 있다.(웹앱서버)
http.createServer(function (req, res) {
    let url = req.url.split("?")[0];//요청한 리소스의 주소;
    let queryString = req.url.split("?")[1]; //요청한 파라미터들
    console.log(url)
    res.setHeader("content-type", "text/html;charset=UTF-8");
    if (url == "/") {//index  동적페이지
        res.write("<h1>node js 의 http 모듈 안녕!</h1>")
        res.write("<h2>npm 으로 nodemon 설치</h2>")
        res.write("<p>npm 은 노드 패키지 매니저로 라이브러리 의존성 주입을 한다.!</p>")
        res.write(`<p>
                    <a href="power.do?a=3&b=6">파라미터 a,b 로 거듭제곱한 결과물을 반환하는 동적페이지</a>
                    </p>`);
        //npx nodemon 이름

        res.end();
    }else if(url=="/power.do"){
        //key=val & key2=val2 & key3=val3 ...
        const params=queryString.split("&");
        const paramObj={};
        params.forEach((param)=>{
          let key=  param.split("=")[0];
          let val= param.split("=")[1];
          paramObj[key]=val;
        });
        console.log(paramObj)
        res.write(`<h1>${paramObj.a} 의 거듭제곱 ${paramObj.b}의 결과는? :${Math.pow(paramObj.a,paramObj.b)}</h1>`)
        res.end();
    }

    else{//찾는 리소스가 없는것 (톰캣은 자동으로)
        req.statusCode=404;
        res.write("<h1>404 찾는 리소스가 없습니다!.</h1>")
        res.end();
    }
}).listen(7070);  //현재 ip 주소:7070 => 서버에 접속. localhost()
//port 0~2000 : os가 system 어플을 위해 사용중이라 0~2000 은 사용 x
//port 3306 : mysql 이 설치되면 무조건사용
//port 80 : 해당 컴퓨터가 서버 컴퓨터가 되면 서버를 서비스하기 위한 기본 포트

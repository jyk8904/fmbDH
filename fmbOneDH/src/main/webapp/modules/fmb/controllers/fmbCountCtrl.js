/**  
 * @Class Name : fmbCountCtrl.js
 * @Description : 설비실적현황
 * @Modification Information  
 * @ 설비 모니터링 화면
 * @ 작업일        작성자       내용
 * @ ----------  ---------  -------------------------------
 * @ 2017.05.29  정유경       최초생성
 * @ 
 * 
 */

'use strict';

angular
    .module('app')
    .controller('FmbCountCtrl', [   'CmmAjaxService'
    							, 'CmmModalSrvc'
    							, 'CmmWorkerSrvc'
    							, '$rootScope'
    						    , 'CmmFactSrvc'
    							, '$http'
    							, '$scope'
    							, '$window'
    							, '$q'
    							, '$filter'
    							, '$location'
    							, '$mdDialog'
    							, '$timeout'
    							, function (
    									  CmmAjaxService
    									, CmmModalSrvc
    									, CmmWorkerSrvc
    									, $rootScope
    								    , CmmFactSrvc
    									, $http
    									, $scope
    									, $window
    									, $q
    									, $filter
    									, $location
    									, $mdDialog
    									, $timeout
    									) 
{
	/*------------------------------------------
     * 변수 선언
     *-----------------------------------------*/
    							    
    var self = this;

    var workerList = CmmWorkerSrvc;
    var promise = null;
    var bgImagePromise = null;
    var eqptPromise = null;
    var plcPromise = null;
    var countEqptPromise = null;
    var countPromise =null;
    $scope.isMobile = false;
    $scope.showBar1 = true;
    $rootScope.showBar = $location.url();
    //count 설비 param
    self.countEqptParamVo = { factId    : 'Comb'
    						, eqptType  : 'COUNT'
    						, id 		: ''
    						, eqptCnm   : ''
			    			}
    //plc parameter
	self.plcParamVo={};
	self.plcParamVo.plcId ='';
	self.plcParamVo.factId ='';
    
	self.countStsData = [];
	self.BgList = {
	    factId: 'Comb'
	};
	$scope.eachBg = {
		  A: ''
	 	, B: ''
	 	, C: ''
	 	, Comb: ''
	};
	
	// 모바일 체크 함수 실행
	isMobileFunc();
    getBgImageList();      
   	getData();
   	dataChk();
   	
    $scope.hover=[];
    $scope.hoverIn = function(index){
   	 $scope.hover[index] = true;
    }
    $scope.hoverOut = function(index){
   	 $scope.hover[index] = false;
    }
	function dataChk(){ //function(getplcList, getEqptList, bindData) 순서제어
	   	    if(self.preplcList==undefined || self.preCountEqptList==undefined){//모든 데이터를 읽지 못했을경우
	   	    	var dataChkTimeout= $timeout(function(){
	   	    	}, 100)
	   	    	.then(function(){
	   	    		dataChk();
	   	    	});
	   		}else{ 													//모든 데이터를 읽어들인 경우
	   			countBindData();
	   			dataChkTimeout.cancel();
	   			dataChkTimeout = null;
	   		}
	   	}
    
    // 모바일 체크 함수 정의
	function isMobileFunc(){
		var UserAgent = navigator.userAgent;

		if (UserAgent.match(/iPhone|iPod|iPad|Android|Windows CE|BlackBerry|Symbian|Windows Phone|webOS|Opera Mini|Opera Mobi|POLARIS|IEMobile|lgtelecom|nokia|SonyEricsson/i) != null || UserAgent.match(/LG|SAMSUNG|Samsung/) != null)
		{
			$scope.isMobile = true;
		}else{
			$scope.isMobile =  false;
		}
	}

	function getBgImageList() {
        bgImagePromise = CmmAjaxService.select("bas/selectFmbBgImage.do", self.BgList);
        bgImagePromise.then(function (data) {
            self.bgImageList = data;
            for (var i = 0; i < self.bgImageList.length; i++) {
                var factId = self.bgImageList[i].factId;

                if (factId == "A") {
                    $scope.eachBg.A = self.bgImageList[i].imgPath;
                } else if (factId == "B") {
                    $scope.eachBg.B = self.bgImageList[i].imgPath;
                } else if (factId == "C") {
                    $scope.eachBg.C = self.bgImageList[i].imgPath;
                } else if (factId == "Comb") {
                    $scope.eachBg.Comb = self.bgImageList[i].imgPath;
                }
            }
            bgImagePromise = null;
        }, function (data) {
    		console.log('fail'+data);
        });
    }
	//워커 스타트
	workerList.workerStart(workerList.worker, "worker.js");
	//워커 온메세진
	workerList.workerOnmessage(workerList.worker, function(){getData(); dataChk();} );
	  
	
    // 팝업 테스트용 코드입니다....
    var customFullscreen = false;

    //count 이미지리스트 가져오기 메소드
    function getCountEqptList(){
	    	countEqptPromise = CmmAjaxService.select("bas/selectFmbEqpt.do", self.countEqptParamVo);
	    	countEqptPromise.then(function(data) {
	    		self.preCountEqptList = data; //fmbEqptVo가 담긴 리스트 형태리턴
	    		self.countEqptList = self.preCountEqptList; 
	    		countEqptPromise = null;
	    	}, function(data){
	    		console.log('fail'+data);
	    	});
    }

	function countBindData(){

		for(var i =0; i < self.countEqptList.length; i++){
			var target = $filter('filter')(self.plcList, {plcId : self.countEqptList[i].id});
			self.countStsData[i]= target[0];
		}
	};

	//설비 plc 데이터 가져오기
	function getPlcList(){
   		plcPromise = CmmAjaxService.select("bas/selectFmbPlc.do", self.plcParamVo);
       	plcPromise.then(function(data) {
       		// 설비상태 카운트 변수
       		self.count0=0; //비가동
       		self.count1=0; //가동
       		self.count2=0; //대기
       		self.count4=0; //알람
       		
       		for(var i=0; i< data.length; i++){
       			if(data[i].plcId.split('_')[0]=="MPLC"){
       				if(data[i].eqptSts ==0){		//비가동 카운트
           				self.count0++;
           			}else if(data[i].eqptSts ==1){	//가동 카운트
           				self.count1++;
           			}else if(data[i].eqptSts ==2){	//대기 카운트
           				self.count2++;
           			}else if(data[i].eqptSts ==4){	//알람 카운트
           				self.count4++;
           			}
       			}
       		}
       		$scope.plcList = data;
       		
       		//데이터를 가져오는동안 깜빡임 방지
       		self.preplcList = data; 
       		self.plcList = self.preplcList;
       		plcPromise = null;
       	}, function(data){
    		console.log('fail'+data);
       });
	}
	function getData(){
		self.preplcList = undefined;
		self.preCountEqptList = undefined;

		getCountEqptList();
   		getPlcList();
	} 	
    	
}]);


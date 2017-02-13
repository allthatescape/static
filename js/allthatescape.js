/**
 * Created by allthatescape on 2016. 8. 17..
 */

var container, options, center, map, positions, imageSrc, markerList, customOverlayList, lastCustomOverlay, positionList;

var isMobileView, region_list, selected_region;

function update_map() {
    update_map_coord_to_form();
    $('form#maprelated').submit();
}

function init_map_vars() {
    container = document.getElementById('map'); //지도를 담을 영역의 DOM 레퍼런스
    options = { //지도를 생성할 때 필요한 기본 옵션
        center: new daum.maps.LatLng(37.56682, 126.97865), //지도의 중심좌표.
        level: 9 //지도의 레벨(확대, 축소 정도)
    };
    map = new daum.maps.Map(container, options); //지도 생성 및 객체 리턴

    // 마커 이미지의 이미지 주소입니다
    imageSrc = "https://i1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png";
}

function init_map() {
    init_map_vars();
    // 지도를 재설정할 범위정보를 가지고 있을 LatLngBounds 객체를 생성합니다
    var bounds = new daum.maps.LatLngBounds();

    // 마커 이미지의 이미지 크기 입니다
    var imageSize = new daum.maps.Size(24, 35);

    // 마커 이미지를 생성합니다
    var markerImage = new daum.maps.MarkerImage(imageSrc, imageSize);

    markerList = [];
    // infoWindowList = [];
    customOverlayList = [];
    positionList = [];

    for (var i = 0; i < positions.length - 1; i ++) {
        var position = positions[i];
        // 마커를 생성합니다
        var marker = new daum.maps.Marker({
            map: map, // 마커를 표시할 지도
            position: position.latlng, // 마커를 표시할 위치
            title : position.title, // 마커의 타이틀, 마커에 마우스를 올리면 타이틀이 표시됩니다
            image : markerImage, // 마커 이미지
        });

        // make inverse dict for lookup
        markerList[position.branchAnchor] = marker;

        var content = '<div class="wrap">' +
            '    <div class="info">' +
            '        <div class="title">' +
            '            ' + position.brandName +
            '            <div class="close" onclick="closeOverlay(customOverlayList[' + position.branchAnchor + ']);" title="닫기"></div>' +
            '        </div>' +
            '        <div class="body">' +
            '            <div class="desc">' +
            '                <div class="ellipsis">' + position.branchName + '</div>' +
            '                <div class="jibun ellipsis">' + position.branchAddr + '</div>' +
            '                <div><a href="http://map.daum.net/link/map/' + position.brandName + '-' + position.branchName + ',' + position.lat + ',' + position.lng + ' "" target="_blank" class="btn btn-default btn-xs" role="button">길찾기</a> <a href="' + position.branchUrl + '" target="_blank" class="btn btn-primary btn-xs" role="button" >홈페이지</a></div>' +
            '            </div>' +
            '        </div>' +
            '    </div>' +
            '</div>';

        // 마커 위에 커스텀오버레이를 표시합니다
        // 마커를 중심으로 커스텀 오버레이를 표시하기위해 CSS를 이용해 위치를 설정했습니다
        var overlay = new daum.maps.CustomOverlay({
            content: content,
            map: null,
            position: marker.getPosition()
        });


        // make inverse dict for lookup
        customOverlayList[position.branchAnchor] = overlay;
        positionList[position.branchAnchor] = position;

        // 마커에 mouseover 이벤트와 mouseout 이벤트를 등록합니다
        // 이벤트 리스너로는 클로저를 만들어 등록합니다
        // for문에서 클로저를 만들어 주지 않으면 마지막 마커에만 이벤트가 등록됩니다
        daum.maps.event.addListener(marker, 'mouseover', makeOverListener(map, overlay));
        // daum.maps.event.addListener(marker, 'mouseout', makeOutListener(overlay));
        $('#branch_title_' + position.branchAnchor).parent().parent().mouseover(branchTitleCellOverListener(map, overlay));
        // $('#branch_title_' + position.branchAnchor).parent().parent().mouseout(makeOutListener(overlay));

        daum.maps.event.addListener(marker, 'click', slideToMarker(map, marker, position.branchAnchor));
        bounds.extend(position.latlng);

    }
    // 지도가 움직이거나 확대, 축소되면 마지막 파라미터로 넘어온 함수를 호출하도록 이벤트를 등록합니다
    if (positions.length - 1 > 0) {
        map.setBounds(bounds);
    } else {
        // map.setLevel(2);
    }
    daum.maps.event.addListener(map, 'zoom_changed', update_map_coord_to_form);
    daum.maps.event.addListener(map, 'dragend', update_map_coord_to_form);
    // daum.maps.event.addListener(map, 'click', removeLastCustomLayout);
}



// 커스텀 오버레이를 닫기 위해 호출되는 함수입니다
function closeOverlay(overlay) {
    overlay.setMap(null);
}

function update_map_coord_to_form() {
    return 0;

    // below is disabled
    // 지도 중심좌표를 얻어옵니다
    var latlng = map.getCenter();
    var bounds = map.getBounds();

    var sw = bounds.getSouthWest(),
        ne = bounds.getNorthEast();

    $('form#maprelated>*>input#id_room__branch__lat_0').val(sw.getLat());
    $('form#maprelated>*>input#id_room__branch__lat_1').val(ne.getLat());
    $('form#maprelated>*>input#id_room__branch__lon_0').val(sw.getLng());
    $('form#maprelated>*>input#id_room__branch__lon_1').val(ne.getLng());
}


function showCustomOverlay(map, overlay) {
    removeLastCustomLayout();
    overlay.setMap(map);
    lastCustomOverlay = overlay;
}

// 인포윈도우를 표시하는 클로저를 만드는 함수입니다
function makeOverListener(map, overlay) {
    return function() {
        if (!isMobileView) {
            showCustomOverlay(map, overlay);
        }
    };
}

// 인포윈도우를 닫는 클로저를 만드는 함수입니다
function makeOutListener(overlay) {
    return function() {
        if (!isMobileView) {
            overlay.setMap(null);
        }
    };
}

// move to center and show infoWindow for marker,
// using at table > tbody > td.branch_title...
function branchTitleCellOverListener(map, overlay) {
    return function() {
        if (!isMobileView) {
            showCustomOverlay(map, overlay);
        }
    };
}


// close all infoWindow in infoWindowList
function removeLastCustomLayout(mouseEvent) {
    if (lastCustomOverlay) {
        lastCustomOverlay.setMap(null);
    }
}


// 해당 마커에 해당하는 지점으로 slide 하는 함수
function slideToMarker(map, marker, branchIdx) {
    return function() {
        $('tr.room-schedule').addClass('desktop-only');
        $('tr.branch').addClass('desktop-only');
        $('tr.branch_idx_' + branchIdx).removeClass('desktop-only')
        $('#branch_title_' + branchIdx).parent().parent().effect("highlight", {}, 2000);

        if (isMobileView) {
            showCustomOverlay(map, customOverlayList[branchIdx]);
            // adjust margin of result table fits for whole window
            var marginTop = $(window).height() - 56 - 70;
            $('div#result').css('margin-top', marginTop + "px");

            // and reset scroll to bottom
            $(document.body).animate({
                'scrollTop':   $('#branch_' + branchIdx).offset().top
            }, 0);
            map.panTo(new daum.maps.LatLng(positionList[branchIdx].lat, positionList[branchIdx].lng));
        } else {
            $(document.body).animate({
                'scrollTop':   $('#branch_' + branchIdx).offset().top - 50
            }, 500);

        }
    };
}

function initMobileView() {
    var marginTop = $(window).height() - 56;
    $('div#result').css('margin-top', marginTop + "px");

    // remove custom show/hide style for class-based table control
    $('tr.room-schedule').removeAttr('style');
}

function initDesktopView() {
    $('div#result').css('margin-top', '0');
}


// run when document is ready or document size changed
function applyWindowResize () {
    // do a load of stuff
    if ($(window).width() >= 720) {
        isMobileView = false;
        initDesktopView()
    } else {
        isMobileView = true;
        initMobileView()
    }
}

// run when location button on table list clicked
function showInfoOnMap (branchIdx) {
    removeLastCustomLayout();
    if (isMobileView) {
        $(document.body).animate({'scrollTop': 0}, 500)
    };
    map.setLevel(4);
    map.panTo(new daum.maps.LatLng(positionList[branchIdx].lat, positionList[branchIdx].lng));
    showCustomOverlay(map, customOverlayList[branchIdx]);
}

// region changed -> remove map coord and form submit
function regionChanged() {
    $('div.id_room__branch__lat_0>input').val('');
    $('div.id_room__branch__lon_0>input').val('');
    if ($('select#id_room__branch__region>option:selected').val() != "") {
        $('form#maprelated').attr('action', '/area/' + $('select#id_room__branch__region>option:selected').attr('canonical'));
    } else {
        $('form#maprelated').attr('action', '/');
    }
    $('select#id_room__branch__region').attr('name', '');
    $('form#maprelated').submit();
}

// when page loaded, insert options in region select
function insertRegionOptions () {
    $('select#id_room__branch__region').append($(new Option('전국', '')));
    for (var i = 0, len = region_list.length; i < len; i++) {
        var region = region_list[i];
        $('select#id_room__branch__region').append($(new Option(region.name, region.id)).attr('canonical', region.canonical));
    }

    // add event for region select input
    $('select#id_room__branch__region').val(selected_region);
    $('select#id_room__branch__region').change(regionChanged);
}

// open safetyImage slider when click check button
function showSwipeBox(branchId) {
    if (positionList[branchId].safetyImageList.length > 0) {
    	$.swipebox(positionList[branchId].safetyImageList);
        ga('send','event','Show Safety Image','{{ branch }}');
    }
}

window.onresize = applyWindowResize;

$(document).ready(function() {
    applyWindowResize();

    insertRegionOptions();
    if (positions.length - 1 == 0) {
        // no schedule returned
        if (isMobileView) {
            var marginTop = $(window).height() - 56 - 150;
            $('div#result').css('margin-top', marginTop + "px");
        }
    }
//    $('span[class^="schedule-idx-"]').addClass('desktop-only');
//    $('span.schedule-idx-1').removeClass('desktop-only');
})

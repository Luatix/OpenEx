import React from 'react';
import PropTypes from 'prop-types';
import LocalMovies from 'material-ui/svg-icons/maps/local-movies';
import HardwareComputer from 'material-ui/svg-icons/hardware/computer';
import HardwareKeyboardArrowRight from 'material-ui/svg-icons/hardware/keyboard-arrow-right';
import HardwareKeyboardArrowLeft from 'material-ui/svg-icons/hardware/keyboard-arrow-left';
import HardwareKeyboardArrowUp from 'material-ui/svg-icons/hardware/keyboard-arrow-up';
import HardwareKeyboardArrowDown from 'material-ui/svg-icons/hardware/keyboard-arrow-down';
import SocialPerson from 'material-ui/svg-icons/social/person';
import SocialGroup from 'material-ui/svg-icons/social/group';
import SocialNotifications from 'material-ui/svg-icons/social/notifications';
import SocialPublic from 'material-ui/svg-icons/social/public';
import SocialSchool from 'material-ui/svg-icons/social/school';
import ContentAdd from 'material-ui/svg-icons/content/add';
import ContentCopy from 'material-ui/svg-icons/content/content-copy';
import ContentMail from 'material-ui/svg-icons/content/mail';
import ContentFlag from 'material-ui/svg-icons/content/flag';
import ContentRemoveCircle from 'material-ui/svg-icons/content/remove-circle';
import ActionDelete from 'material-ui/svg-icons/action/delete';
import ActionSettings from 'material-ui/svg-icons/action/settings';
import ActionDocuments from 'material-ui/svg-icons/action/dashboard';
import ActionSchedule from 'material-ui/svg-icons/action/schedule';
import ActionEvent from 'material-ui/svg-icons/action/event';
import ActionExitToApp from 'material-ui/svg-icons/action/exit-to-app';
import ActionCheckCircle from 'material-ui/svg-icons/action/check-circle';
import ActionDone from 'material-ui/svg-icons/action/done';
import ActionDoneAll from 'material-ui/svg-icons/action/done-all';
import ActionDescription from 'material-ui/svg-icons/action/description';
import ActionRowing from 'material-ui/svg-icons/action/rowing';
import ActionInput from 'material-ui/svg-icons/action/input';
import NavigationMoreVert from 'material-ui/svg-icons/navigation/more-vert';
import NavigationMoreHoriz from 'material-ui/svg-icons/navigation/more-horiz';
import NavigationArrowDropDown from 'material-ui/svg-icons/navigation/arrow-drop-down';
import NavigationArrowDropUp from 'material-ui/svg-icons/navigation/arrow-drop-up';
import NavigationCancel from 'material-ui/svg-icons/navigation/cancel';
import ActionAssignmentTurnedIn from 'material-ui/svg-icons/action/assignment-turned-in';
import FileFolder from 'material-ui/svg-icons/file/folder';
import FileFileDownload from 'material-ui/svg-icons/file/file-download';
import EditorAttachFile from 'material-ui/svg-icons/editor/attach-file';
import EditorInsertChart from 'material-ui/svg-icons/editor/insert-chart';
import MapsLayers from 'material-ui/svg-icons/maps/layers';
import NotificationSms from 'material-ui/svg-icons/notification/sms';
import NotificationNetworkCheck from 'material-ui/svg-icons/notification/network-check';
import NotificationOndemandVideo from 'material-ui/svg-icons/notification/ondemand-video';
import ImageCenterFocusStrong from 'material-ui/svg-icons/image/center-focus-strong';
import ImageCenterFocusWeak from 'material-ui/svg-icons/image/center-focus-weak';
import AVPlayArrow from 'material-ui/svg-icons/av/play-arrow';
import AVSlowMotionVideo from 'material-ui/svg-icons/av/slow-motion-video';
import AVPlayCircleOutline from 'material-ui/svg-icons/av/play-circle-outline';
import AVNote from 'material-ui/svg-icons/av/note';
import AVCallToAction from 'material-ui/svg-icons/av/call-to-action';
import DeviceGraphicEq from 'material-ui/svg-icons/device/graphic-eq';
import DateRange from 'material-ui/svg-icons/action/date-range';
import AccessTime from 'material-ui/svg-icons/device/access-time';
import ActionDocumentDelete from 'material-ui/svg-icons/action/delete';
import ActionDocumentExport from 'material-ui/svg-icons/file/cloud-download';
import ActionDocumentView from 'material-ui/svg-icons/content/create';
import ActionDocumentEdit from 'material-ui/svg-icons/image/remove-red-eye';
import * as Constants from '../constants/ComponentTypes';

const iconStyle = {
  [Constants.ICON_TYPE_NAVBAR]: {
    margin: 0,
    padding: 0,
    left: '19px',
    top: '8px',
  },
  [Constants.ICON_TYPE_SORT]: {
    position: 'absolute',
    margin: '0 0 0 5px',
    padding: 0,
    top: '16px',
  },
  [Constants.ICON_TYPE_LIST]: {
    position: 'absolute',
    top: '18px',
    left: '10px',
  },
  [Constants.ICON_TYPE_MAINLIST]: {
    position: 'absolute',
    padding: 0,
    top: '8px',
  },
  [Constants.ICON_TYPE_MAINLIST2]: {
    position: 'absolute',
    padding: 0,
    top: '18px',
  },
  [Constants.ICON_TYPE_MAINLIST_RIGHT]: {
    position: 'absolute',
    top: '20px',
  },
  [Constants.ICON_TYPE_LEFT]: {
    float: 'left',
    margin: '10px 5px 0px 0px',
  },
};

export const Icon = (props) => {
  const mergeStyle = { ...props.style, ...iconStyle[props.type] };
  switch (props.name) {
    case Constants.ICON_NAME_DOCUMENT_ACTION_DELETE:
      return <ActionDocumentDelete style={mergeStyle} color={props.color} />;
    case Constants.ICON_NAME_DOCUMENT_ACTION_EXPORT:
      return <ActionDocumentExport style={mergeStyle} color={props.color} />;
    case Constants.ICON_NAME_DOCUMENT_ACTION_VIEW:
      return <ActionDocumentView style={mergeStyle} color={props.color} />;
    case Constants.ICON_NAME_DOCUMENT_ACTION_EDIT:
      return <ActionDocumentEdit style={mergeStyle} color={props.color} />;
    case Constants.ICON_NAME_LOCAL_MOVIES:
      return <LocalMovies style={mergeStyle} color={props.color} />;
    case Constants.ICON_NAME_HARDWARE_COMPUTER:
      return <HardwareComputer style={mergeStyle} color={props.color} />;
    case Constants.ICON_NAME_HARDWARE_KEYBOARD_ARROW_RIGHT:
      return (
        <HardwareKeyboardArrowRight style={mergeStyle} color={props.color} />
      );
    case Constants.ICON_NAME_HARDWARE_KEYBOARD_ARROW_LEFT:
      return (
        <HardwareKeyboardArrowLeft style={mergeStyle} color={props.color} />
      );
    case Constants.ICON_NAME_HARDWARE_KEYBOARD_ARROW_UP:
      return <HardwareKeyboardArrowUp style={mergeStyle} color={props.color} />;
    case Constants.ICON_NAME_HARDWARE_KEYBOARD_ARROW_DOWN:
      return (
        <HardwareKeyboardArrowDown style={mergeStyle} color={props.color} />
      );
    case Constants.ICON_NAME_SOCIAL_PERSON:
      return <SocialPerson style={mergeStyle} color={props.color} />;
    case Constants.ICON_NAME_TESTS:
      return <SocialNotifications style={mergeStyle} color={props.color} />;
    case Constants.ICON_NAME_SOCIAL_GROUP:
      return <SocialGroup style={mergeStyle} color={props.color} />;
    case Constants.ICON_NAME_SOCIAL_PUBLIC:
      return <SocialPublic style={mergeStyle} color={props.color} />;
    case Constants.ICON_NAME_SOCIAL_SCHOOL:
      return <SocialSchool style={mergeStyle} color={props.color} />;
    case Constants.ICON_NAME_CONTENT_ADD:
      return <ContentAdd style={mergeStyle} color={props.color} />;
    case Constants.ICON_NAME_CONTENT_COPY:
      return <ContentCopy style={mergeStyle} color={props.color} />;
    case Constants.ICON_NAME_CONTENT_MAIL:
      return <ContentMail style={mergeStyle} color={props.color} />;
    case Constants.ICON_NAME_CONTENT_FLAG:
      return <ContentFlag style={mergeStyle} color={props.color} />;
    case Constants.ICON_NAME_CONTENT_REMOVE_CIRCLE:
      return <ContentRemoveCircle style={mergeStyle} color={props.color} />;
    case Constants.ICON_NAME_ACTION_DELETE:
      return <ActionDelete style={mergeStyle} color={props.color} />;
    case Constants.ICON_NAME_ACTION_SETTINGS:
      return <ActionSettings style={mergeStyle} color={props.color} />;
    case Constants.ICON_NAME_ACTION_DOCUMENTS:
      return <ActionDocuments style={mergeStyle} color={props.color} />;
    case Constants.ICON_NAME_ACTION_SCHEDULE:
      return <ActionSchedule style={mergeStyle} color={props.color} />;
    case Constants.ICON_NAME_ACTION_EVENT:
      return <ActionEvent style={mergeStyle} color={props.color} />;
    case Constants.ICON_NAME_ACTION_EXIT_TO_APP:
      return <ActionExitToApp style={mergeStyle} color={props.color} />;
    case Constants.ICON_NAME_ACTION_ASSIGNMENT_TURNED_IN:
      return (
        <ActionAssignmentTurnedIn style={mergeStyle} color={props.color} />
      );
    case Constants.ICON_NAME_ACTION_CHECK_CIRCLE:
      return <ActionCheckCircle style={mergeStyle} color={props.color} />;
    case Constants.ICON_NAME_ACTION_DONE:
      return <ActionDone style={mergeStyle} color={props.color} />;
    case Constants.ICON_NAME_ACTION_DONE_ALL:
      return <ActionDoneAll style={mergeStyle} color={props.color} />;
    case Constants.ICON_NAME_ACTION_DESCRIPTION:
      return <ActionDescription style={mergeStyle} color={props.color} />;
    case Constants.ICON_NAME_ACTION_ROWING:
      return <ActionRowing style={mergeStyle} color={props.color} />;
    case Constants.ICON_NAME_ACTION_INPUT:
      return <ActionInput style={mergeStyle} color={props.color} />;
    case Constants.ICON_NAME_NAVIGATION_MORE_VERT:
      return <NavigationMoreVert style={mergeStyle} color={props.color} />;
    case Constants.ICON_NAME_NAVIGATION_MORE_HORIZ:
      return <NavigationMoreHoriz style={mergeStyle} color={props.color} />;
    case Constants.ICON_NAME_NAVIGATION_ARROW_DROP_DOWN:
      return <NavigationArrowDropDown style={mergeStyle} color={props.color} />;
    case Constants.ICON_NAME_NAVIGATION_ARROW_DROP_UP:
      return <NavigationArrowDropUp style={mergeStyle} color={props.color} />;
    case Constants.ICON_NAME_NAVIGATION_CANCEL:
      return <NavigationCancel style={mergeStyle} color={props.color} />;
    case Constants.ICON_NAME_FILE_FOLDER:
      return <FileFolder style={mergeStyle} color={props.color} />;
    case Constants.ICON_NAME_FILE_FILE_DOWNLOAD:
      return <FileFileDownload style={mergeStyle} color={props.color} />;
    case Constants.ICON_NAME_MAPS_LAYERS:
      return <MapsLayers style={mergeStyle} color={props.color} />;
    case Constants.ICON_NAME_NOTIFICATION_SMS:
      return <NotificationSms style={mergeStyle} color={props.color} />;
    case Constants.ICON_NAME_NOTIFICATION_NETWORK_CHECK:
      return (
        <NotificationNetworkCheck style={mergeStyle} color={props.color} />
      );
    case Constants.ICON_NAME_NOTIFICATION_ONDEMAND_VIDEO:
      return (
        <NotificationOndemandVideo style={mergeStyle} color={props.color} />
      );
    case Constants.ICON_NAME_EDITOR_ATTACH_FILE:
      return <EditorAttachFile style={mergeStyle} color={props.color} />;
    case Constants.ICON_NAME_EDITOR_INSERT_CHART:
      return <EditorInsertChart style={mergeStyle} color={props.color} />;
    case Constants.ICON_NAME_IMAGE_CENTER_FOCUS_STRONG:
      return <ImageCenterFocusStrong style={mergeStyle} color={props.color} />;
    case Constants.ICON_NAME_IMAGE_CENTER_FOCUS_WEAK:
      return <ImageCenterFocusWeak style={mergeStyle} color={props.color} />;
    case Constants.ICON_NAME_AV_PLAY_ARROW:
      return <AVPlayArrow style={mergeStyle} color={props.color} />;
    case Constants.ICON_NAME_AV_SLOW_MOTION_VIDEO:
      return <AVSlowMotionVideo style={mergeStyle} color={props.color} />;
    case Constants.ICON_NAME_AV_PLAY_CIRCLE_OUTLINE:
      return <AVPlayCircleOutline style={mergeStyle} color={props.color} />;
    case Constants.ICON_NAME_AV_NOTE:
      return <AVNote style={mergeStyle} color={props.color} />;
    case Constants.ICON_NAME_AV_CALL_TO_ACTION:
      return <AVCallToAction style={mergeStyle} color={props.color} />;
    case Constants.ICON_NAME_DEVICE_GRAPHIC_EQ:
      return <DeviceGraphicEq style={mergeStyle} color={props.color} />;
    case Constants.ICON_NAME_DATE_RANGE:
      return <DateRange style={mergeStyle} color={props.color} />;
    case Constants.ICON_NAME_ACCESS_TIME:
      return <AccessTime style={mergeStyle} color={props.color} />;
    default:
      return <HardwareComputer style={mergeStyle} color={props.color} />;
  }
};

Icon.propTypes = {
  name: PropTypes.string,
  type: PropTypes.string,
  style: PropTypes.object,
  color: PropTypes.string,
};

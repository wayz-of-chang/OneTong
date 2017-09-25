import React from 'react';
import LocalizationStrings from 'react-native-localization';
import KeyboardSpacer from 'react-native-keyboard-spacer';
import Flag from 'react-native-flags';
import { StackNavigator } from 'react-navigation';
import { StyleSheet, Text, TextInput, FlatList, ScrollView, View, Picker, Switch, Button, StatusBar, TouchableHighlight, Alert, AsyncStorage, Platform, Keyboard, Clipboard } from 'react-native';
import * as GLOBAL from './Globals';

export default class App extends React.Component {
  render() {
    return (
      <AppNavigator ref={nav => { this.navigator = nav; }} />
	);
  }
}

class ConversationList extends React.Component {
  static navigationOptions = ({ navigation }) => {
	const {params = {}} = navigation.state;
	return {
	  title: strings.conversations,
	  headerRight: <View style={{marginRight: 20, flexDirection: 'row'}}><Button color='#ccc' title={strings.about} onPress={() => params._showAbout()} /></View>
    }
  }
  
  constructor(props) {
	super(props);

	this.state = { conversations: [] };
  }
  
  componentDidMount() {
	this._updateConversations()
  }

  componentWillMount() {
	this.props.navigation.setParams({
	  _showAbout: this._showAbout.bind(this)
	});
  }

  render() {
	const { navigate } = this.props.navigation;
    return (
      <View style={styles.container}>
        <FlatList style={{flexGrow: 1}} data={this.state.conversations} renderItem={this._renderConversation.bind(this)} enableEmptySections={true} keyExtractor={(item, index) => {return index}}/>
        <View style={styles.buttonContainer}>
          <Button onPress={() => navigate('New Conversation', {_updateConversations: this._updateConversations.bind(this)})} title={strings.new} />
        </View>
      </View>
    );
  }
  
  _renderConversation(rowData) {
	let item = rowData.item
	let countryCode1 = this._getCountryCode(item.language1)
	let countryCode2 = this._getCountryCode(item.language2)
	return (
	  <View>
	    <TouchableHighlight style={{borderRadius: 5}} underlayColor='#88f' onPress={() => this._goToConversation(item)}>
	      <View style={styles.row}>
	        <Text style={styles.text}>
	          {item.text}
	        </Text>
	        <Flag code={countryCode1} size={48} type='shiny'/>
	        <Flag code={countryCode2} size={48} type='shiny'/>
	        <Text>
	          {'  '}
	        </Text>
	        <Button color='#aaa' onPress={() => {this._removeConversation(item.text, rowData.index)}} title={strings.delete} />
	      </View>
	    </TouchableHighlight>
	  </View>
	);
  }
  
  _goToConversation(row) {
	const { navigate } = this.props.navigation;
	navigate('Chat', row);
  }
  
  _updateConversations() {
	AsyncStorage.getItem('Conversations').then((value) => {
      let conversations = [];
	  if (value != '' && value != null) {
		conversations = JSON.parse(value);
	  }
	  this.setState({'conversations': conversations});
	}).done();
  }
  
  _removeConversation(row, index) {
    Alert.alert(
      strings.confirm_deletion,
      strings.deletion_message + row + '?',
      [
        {text: strings.no, onPress: () => {}},
        {text: strings.yes, onPress: () => {this._deleteConversation(row, index)}}
      ]
    )
  }
  
  _deleteConversation(row, index) {
	this.state.conversations.splice(index, 1)
	this.setState({conversations: this.state.conversations})
    try { 
	  AsyncStorage.setItem('Conversations', JSON.stringify(this.state.conversations)).done(); 
	  AsyncStorage.removeItem('Chat.'+row);
	} catch (error) { 
	  Alert.alert(strings.deletion_error); 
	}
  }
  
  _getCountryCode(locale) {
	let locale_country_map = {
	  'en': 'US',
	  'zh-CN': 'CN',
	  'zh-TW': 'TW',
	  'cs': 'CZ',
	  'nl': 'NL',
	  'fr': 'FR',
	  'de': 'DE',
	  'hi': 'IN',
	  'it': 'IT',
	  'ja': 'JP',
	  'ko': 'KP',
	  'ne': 'NP',
	  'pl': 'PL',
	  'pt': 'PT',
	  'es': 'ES',
	  'tl': 'PH',
	  'th': 'TH',
	  'vi': 'VN'
	}
	return locale_country_map[locale]
  }
  
  _showAbout() {
	Alert.alert(strings.about, strings.info)
  }
}

class ChatScreen extends React.Component {
  static navigationOptions = ({ navigation }) => {
	const {params = {}} = navigation.state;
	return {
	  title: navigation.state.params.text.length > 20 ? navigation.state.params.text.substr(0, 20) + '...' : navigation.state.params.text,
	  headerRight: <View style={{marginRight: 20, flexDirection: 'row'}}><Flag code={params.countryCode1} size={48} type={params.selectedLanguage == 1 ? 'shiny' : 'flat'}/><Switch onTintColor='#00f' tintColor='#f00' onValueChange={(value) => {params._switchLanguage()}} value={params.selectedLanguage == 2}/><Flag code={params.countryCode2} size={48} type={params.selectedLanguage == 2 ? 'shiny' : 'flat'}/></View>
	}
  }
  
  constructor(props) {
	super(props);

	this.state = props.navigation.state.params;
	this.state.input = '';
	this.state.selectedLanguage = 1;
	
	this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (evt) => {this._scrollToEnd()})
	this.keyboardDidShowListener = Keyboard.addListener('keyboardDidHide', (evt) => {this._scrollToEnd()})
  }
  
  componentWillMount() {
	this.props.navigation.setParams({
	  _switchLanguage: this._switchLanguage.bind(this),
	  countryCode1: this._getCountryCode(this.state.language1),
	  countryCode2: this._getCountryCode(this.state.language2),
	  selectedLanguage: this.state.selectedLanguage
	});
  }
  
  componentDidMount() {
	AsyncStorage.getItem('Chat.'+this.state.text).then((value) => {
      let source = [];
	  if (value != '' && value != null) {
		source = JSON.parse(value);
	  }
	  this.setState({'source': source});
	}).done();
  }

  render() {
	const { navigate } = this.props.navigation;
    return (
      <View style={{flex: 1, flexDirection: 'column'}}>
        <FlatList style={{flex: 1}} data={this.state.source} extraData={this.state.selectedLanguage} renderItem={this._renderChat.bind(this)} enableEmptySections={true} ref="listView" keyExtractor={(item, index) => {return index}}/>
        <View style={this.state.selectedLanguage == 1 ? styles.inputContainer1 : styles.inputContainer2}>
          <TextInput style={styles.input} autoFocus={true} onChangeText={(input) => this.setState({input})} onSubmitEditing={this._sendMessage.bind(this)} value={this.state.input} />
          <Button color={this.state.selectedLanguage == 1 ? '#f00' : '#00f'} onPress={this._sendMessage.bind(this)} title={strings.send} />
        </View>
      </View>
    );
  }
  
  _renderChat(rowData) {
	let item = rowData.item
	return (
      <View style={{flexDirection: 'row', margin: 5, flex: 1}}>
	    <View style={{flex: 1, flexDirection: 'column'}}>
  	      <TouchableHighlight underlayColor='#aaa' style={item.language == 1 ? styles.language1Text : styles.language2Text} onPress={() => {Clipboard.setString(this.state.selectedLanguage == item.language ? item.text : item.translated)}}>
	        <Text style={item.language == 1 ? styles.language1Align : styles.language2Align}>
	          {this.state.selectedLanguage == item.language ? item.text : item.translated}
	        </Text>
	      </TouchableHighlight>
	    </View>
	  </View>
	);
  }
  
  _sendMessage() {
	let request = {
	  'q': this.state.input,
	  'source': this.state.selectedLanguage == 1 ? this.state.language1 : this.state.language2,
	  'target': this.state.selectedLanguage == 1 ? this.state.language2 : this.state.language1,
	  'format': 'text'
	}
	fetch('https://translation.googleapis.com/language/translate/v2?key=' + GLOBAL.API_KEY, {
	  method: 'POST',
	  body: JSON.stringify(request)
	}).then((response) => {
	  let data = JSON.parse(response._bodyText)
	  if (data.data != undefined && data.data.translations != undefined) {
		data = data.data.translations[0].translatedText
	  } else {
		data = ''
	  }
      this.state.source = this.state.source.concat([{text: this.state.input, language: this.state.selectedLanguage, translated: data}])
      AsyncStorage.setItem('Chat.'+this.state.text, JSON.stringify(this.state.source)).done()
      this._scrollToEnd()
      this._switchLanguage()
	  return data
	}).catch((error) => {
	  console.error(error)
	}).done()
  }
  
  _scrollToEnd() {
	setTimeout(() => {try {this.refs.listView.scrollToEnd()} catch (error) {}}, 100)
  }
  
  _switchLanguage() {
	this.state.selectedLanguage == 1 ? this.state.selectedLanguage = 2 : this.state.selectedLanguage = 1
	this.props.navigation.setParams({
	  selectedLanguage: this.state.selectedLanguage
	});
	this.setState({ input: '' })
  }
  
  _getCountryCode(locale) {
	let locale_country_map = {
	  'en': 'US',
	  'zh-CN': 'CN',
	  'zh-TW': 'TW',
	  'cs': 'CZ',
	  'nl': 'NL',
	  'fr': 'FR',
	  'de': 'DE',
	  'hi': 'IN',
	  'it': 'IT',
	  'ja': 'JP',
	  'ko': 'KP',
	  'ne': 'NP',
	  'pl': 'PL',
	  'pt': 'PT',
	  'es': 'ES',
	  'tl': 'PH',
	  'th': 'TH',
	  'vi': 'VN'
	}
	return locale_country_map[locale]
  }
}

class AddConversation extends React.Component {
  static navigationOptions = ({ navigation }) => {
	const {params = {}} = navigation.state;
	return {
	  title: strings.new_conversation
	}
  }
  constructor(props) {
	super(props);
	this.state = { text: '', language1: 'en', language2: 'en' };
  }
  render() {
	const { goBack, state } = this.props.navigation;
    return (
      <View style={styles.container}>
        <ScrollView style={{flex: 1, flexDirection: 'column'}}>
          <Text style={styles.spacer}></Text>
          <Text style={styles.label}>{strings.name}</Text>
          <TextInput style={{margin: 20}} autoFocus={true} onChangeText={(textValue) => this.setState({text: textValue})} value={this.state.text} />
          <Text style={styles.label}>{strings.language1}</Text>
          <Picker style={{margin: 20}} selectedValue={this.state.language1} onValueChange={(itemValue, itemIndex) => this.setState({language1: itemValue})}>
            <Picker.Item label="English" value="en" />
            <Picker.Item label="Chinese (Simplified)" value="zh-CN" />
            <Picker.Item label="Chinese (Traditional)" value="zh-TW" />
            <Picker.Item label="Czech" value="cs" />
            <Picker.Item label="Dutch" value="nl" />
            <Picker.Item label="French" value="fr" />
            <Picker.Item label="German" value="de" />
            <Picker.Item label="Hindi" value="hi" />
            <Picker.Item label="Italian" value="it" />
            <Picker.Item label="Japanese" value="ja" />
            <Picker.Item label="Korean" value="ko" />
            <Picker.Item label="Nepali" value="ne" />
            <Picker.Item label="Polish" value="pl" />
            <Picker.Item label="Portuguese" value="pt" />
            <Picker.Item label="Spanish" value="es" />
            <Picker.Item label="Tagalog" value="tl" />
            <Picker.Item label="Thai" value="th" />
            <Picker.Item label="Vietnamese" value="vi" />
          </Picker>
          <Text style={styles.label}>{strings.language2}</Text>
          <Picker style={{margin: 20}} selectedValue={this.state.language2} onValueChange={(itemValue, itemIndex) => this.setState({language2: itemValue})}>
            <Picker.Item label="English" value="en" />
            <Picker.Item label="Chinese (Simplified)" value="zh-CN" />
            <Picker.Item label="Chinese (Traditional)" value="zh-TW" />
            <Picker.Item label="Czech" value="cs" />
            <Picker.Item label="Dutch" value="nl" />
            <Picker.Item label="French" value="fr" />
            <Picker.Item label="German" value="de" />
            <Picker.Item label="Hindi" value="hi" />
            <Picker.Item label="Italian" value="it" />
            <Picker.Item label="Japanese" value="ja" />
            <Picker.Item label="Korean" value="ko" />
            <Picker.Item label="Nepali" value="ne" />
            <Picker.Item label="Polish" value="pl" />
            <Picker.Item label="Portuguese" value="pt" />
            <Picker.Item label="Spanish" value="es" />
            <Picker.Item label="Tagalog" value="tl" />
            <Picker.Item label="Thai" value="th" />
            <Picker.Item label="Vietnamese" value="vi" />
          </Picker>
        </ScrollView>
        <View style={styles.buttonContainer}>
          <Button onPress={ () => this._saveConversations(goBack, state).done()} title={strings.add} />
        </View>
      </View>
    );
  }
  
  async _saveConversations(goBack, state) {
    try { 
	  AsyncStorage.getItem('Conversations').then((value) => {
        let conversations = [];
		if (value != '' && value != null) {
		  conversations = JSON.parse(value);
		}
		conversations.push(this.state);
		AsyncStorage.setItem('Conversations', JSON.stringify(conversations)).done(); 
	  }).then(() => {
        state.params._updateConversations();
	    goBack();
	  }).done();
	} catch (error) { 
	  Alert.alert(strings.add_error); 
	}
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#fff',
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  buttonContainer: {
	margin: 10
  },
  inputContainer1: {
	flex: 0,
	flexDirection: 'row',
    backgroundColor: '#fdd',
    alignItems: 'center',
	padding: 10
  },
  inputContainer2: {
	flex: 0,
	flexDirection: 'row',
    backgroundColor: '#ddf',
    alignItems: 'center',
	padding: 10
  },
  row: {
	flexDirection: 'row',
	alignItems: 'center',
	justifyContent: 'center',
    backgroundColor: '#fff',
	padding: 10,
	margin: 5
  },
  text: {
	flex: 1,
    fontWeight: 'bold',
	color: '#000',
  },
  language1Text: {
	alignSelf: 'flex-start',
	padding: 10, 
	backgroundColor: '#fdd',
	borderRadius: 5
  },
  language2Text: {
	alignSelf: 'flex-end',
	padding: 10, 
	backgroundColor: '#ddf',
	borderRadius: 5
  },
  language1Align: {
	color: '#000',
	textAlign: 'left'
  },
  language2Align: {
	color: '#000',
	textAlign: 'right'
  },
  input: {
	flex: 1
  },
  inputSubmit: {
	flex: 0
  },
  label: {
	marginLeft: 20,
	marginRight: 20,
	fontWeight: 'bold'
  },
  spacer: {
	margin: 20
  }
});

const AppNavigator = StackNavigator({
  Conversations: { screen: ConversationList },
  Chat: { screen: ChatScreen },
  "New Conversation": { screen: AddConversation }
},{
  cardStyle: {
	paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight - StatusBar.currentHeight
  }
});

const strings = new LocalizationStrings({
  en: {
	conversations: "Conversations",
	about: "About",
	"new": "New",
	"delete": "Delete",
	confirm_deletion: 'Confirm Deletion',
	deletion_message: 'Are you sure you want to delete ',
	deletion_error: 'Could not delete conversation',
	no: 'No',
	yes: 'Yes',
	about: 'About',
	info: 'This is just a basic conversation translator app to help people hold conversations between two languages.  Written by David Chang (2017).',
	send: "Send",
	new_conversation: 'New Conversation',
	name: "Name",
	language1: "Your Language",
	language2: "Translated Language",
	add: "Add",
	add_error: 'Could not add new conversation'
  }
});

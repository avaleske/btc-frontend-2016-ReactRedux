import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'
import {loadStateSummaryInfo} from '../../actions'
import DataBoxGroup from '../../components/DataBoxes/DataBoxGroup.jsx';


function loadData(props) {
  debugger
  props.loadStateSummaryInfo();
}

class HomePageSummary extends Component {
  constructor(props){
    debugger
    super(props)
  }
  componentWillMount() {
    debugger
    loadData(this.props);
  }

  render(){
    debugger
    const { stateSummary } = this.props
    if (!stateSummary) {
      // needs loading icon here
      return <h1><i>Loading... </i></h1>
    }

    return (
      <div>
      oh hai.
    </div>
    )
  }
}

HomePageSummary.propTypes = {
  stateSummary: PropTypes.object
}

function mapStateToProps(state, ownProps) {
  debugger
  const { entities: {
    stateSummary
  } } = state;
  return {
    stateSummary
  }
}

export default connect(mapStateToProps, {
  loadStateSummaryInfo
})(HomePageSummary)
